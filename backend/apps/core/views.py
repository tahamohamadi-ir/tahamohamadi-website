"""Core views: health probes, contact form, auth, and the plain-Django error handlers."""

from __future__ import annotations

import logging

import django
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.mail import send_mail
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from apps.core.exceptions import PROBLEM_CONTENT_TYPE, build_problem, problem_json_response
from apps.core.content_health import content_health_report
from apps.core.models import ContactMessage
from apps.core.seed_review import seed_review_report
from apps.core.serializers import (
    ContactMessageDetailSerializer,
    ContactMessageInboxSerializer,
    ContactMessageSerializer,
    ContactMessageTransitionSerializer,
)
from apps.core.throttling import ContactRateThrottle, LoginRateThrottle

logger = logging.getLogger(__name__)


class PublicHealthView(APIView):
    """`GET /api/public/health/` — unauthenticated liveness probe."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response(
            {
                "status": "ok",
                "service": "tahamohamadi-backend",
                "django_version": django.get_version(),
                "locales": list(settings.CONTENT_LOCALES),
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(ensure_csrf_cookie, name="dispatch")
class PublicContactView(APIView):
    """`POST /api/public/contact/` — public contact form submission.
    `GET /api/public/contact/` — sets CSRF cookie for the form.

    Accepts name, email, subject, message. Validates server-side.
    CSRF enforcement is handled by Django middleware (cookie-based).
    """

    permission_classes = [AllowAny]
    throttle_classes = [ContactRateThrottle]

    def get_throttles(self):
        """Do not charge the CSRF-cookie bootstrap against message quota."""
        return super().get_throttles() if self.request.method == "POST" else []

    def get(self, request: Request) -> Response:
        """Return empty response to set CSRF cookie via middleware."""
        return Response({"csrf": "cookie-set"}, status=status.HTTP_200_OK)

    def post(self, request: Request) -> Response:
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        if data.get("website"):
            # Honeypot submissions receive the same response, without email
            # forwarding or personal data written to application logs.
            return Response(
                {"status": "sent", "message": "Your message has been received."},
                status=status.HTTP_200_OK,
            )

        ContactMessage.objects.create(
            name=data["name"],
            email=data["email"],
            subject=data["subject"],
            message=data["message"],
        )

        logger.info("Contact form submission accepted.")

        # Attempt to send email notification if email is configured
        try:
            admin_email = getattr(settings, "CONTACT_FORM_RECIPIENT", None)
            if admin_email:
                send_mail(
                    subject=f"[Contact] {data['subject']}",
                    message=(
                        f"From: {data['name']} <{data['email']}>\n\n"
                        f"{data['message']}"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
        except Exception:
            logger.exception("Failed to send contact form email")

        return Response(
            {"status": "sent", "message": "Your message has been received."},
            status=status.HTTP_200_OK,
        )


class AdminHealthView(APIView):
    """`GET /api/admin/health/` — authenticated probe for the admin surface."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(
            {
                "status": "ok",
                "user": request.user.get_username(),
            },
            status=status.HTTP_200_OK,
        )


class LoginSerializer(serializers.Serializer):
    """Validates login credentials."""

    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})


@method_decorator(ensure_csrf_cookie, name="dispatch")
class SessionLoginView(APIView):
    """`POST /api/admin/login/` — create a session for the admin panel.

    Rate limited to 5 requests per minute (Requirement 3.7).
    CSRF is exempt on login (user doesn't have a session yet).
    """

    permission_classes = [AllowAny]
    authentication_classes = []  # No auth required to login
    throttle_classes = [LoginRateThrottle]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )

        if user is None:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "Account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        login(request, user)
        return Response(
            {
                "status": "authenticated",
                "user": user.get_username(),
            },
            status=status.HTTP_200_OK,
        )


class SessionLogoutView(APIView):
    """`POST /api/admin/logout/` — destroy the current session."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        logout(request)
        return Response(
            {"status": "logged_out"},
            status=status.HTTP_200_OK,
        )


class AdminDashboardView(APIView):
    """`GET /api/admin/dashboard/` — dashboard statistics for admin panel.

    Returns content counts, workflow status breakdown, and recent activity.
    Requirement 11.1.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        from apps.cms.models import Page
        from apps.blog.models import Article
        from apps.portfolio.models import CaseStudy
        from apps.media.models import MediaAsset
        from apps.workflow.models import AuditEvent

        # Content statistics
        content_stats = {
            "pages": Page.objects.count(),
            "articles": Article.objects.count(),
            "case_studies": CaseStudy.objects.count(),
            "media_assets": MediaAsset.objects.filter(status="active").count(),
        }

        # Workflow status counts across all content types
        workflow_status = {
            "draft": 0,
            "in_review": 0,
            "scheduled": 0,
            "published": 0,
        }

        for model in [Page, Article, CaseStudy]:
            for status_key in workflow_status:
                workflow_status[status_key] += model.objects.filter(
                    status=status_key
                ).count()

        # Recent activity: last 10 audit events
        recent_events = AuditEvent.objects.select_related(
            "user", "content_type"
        ).order_by("-timestamp")[:10]

        recent_activity = []
        for event in recent_events:
            recent_activity.append(
                {
                    "id": str(event.id),
                    "content_type": (
                        f"{event.content_type.app_label}.{event.content_type.model}"
                        if event.content_type
                        else "unknown"
                    ),
                    "object_id": str(event.object_id),
                    "from_status": event.from_status,
                    "to_status": event.to_status,
                    "user": (
                        event.user.get_username() if event.user else "system"
                    ),
                    "timestamp": event.timestamp.isoformat(),
                    "reason": event.reason,
                }
            )

        return Response(
            {
                "content_stats": content_stats,
                "workflow_status": workflow_status,
                "recent_activity": recent_activity,
            },
            status=status.HTTP_200_OK,
        )


class AdminContentHealthView(APIView):
    """Report actionable health findings computed from current stored data."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(content_health_report(), status=status.HTTP_200_OK)


class AdminContactMessageViewSet(ReadOnlyModelViewSet):
    """Protected inbox for persisted contact submissions."""

    queryset = ContactMessage.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status"]
    search_fields = ["name", "email", "subject"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ContactMessageInboxSerializer
        if self.action in {"mark_read", "archive"}:
            return ContactMessageTransitionSerializer
        return ContactMessageDetailSerializer

    def _invalid_transition(self, request, detail: str) -> Response:
        return Response(
            build_problem(status.HTTP_400_BAD_REQUEST, detail, instance=request.path),
            status=status.HTTP_400_BAD_REQUEST,
            content_type=PROBLEM_CONTENT_TYPE,
        )

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if message.status == ContactMessage.Status.ARCHIVED:
            return self._invalid_transition(request, "Archived contact messages cannot be marked as read.")
        if message.status == ContactMessage.Status.NEW:
            message.status = ContactMessage.Status.READ
            message.updated_by = request.user.get_username()
            message.save(update_fields=["status", "updated_by", "updated_at"])
        return Response(self.get_serializer(message).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        message = self.get_object()
        if message.status == ContactMessage.Status.NEW:
            return self._invalid_transition(request, "Contact messages must be marked as read before archiving.")
        if message.status == ContactMessage.Status.READ:
            message.status = ContactMessage.Status.ARCHIVED
            message.updated_by = request.user.get_username()
            message.save(update_fields=["status", "updated_by", "updated_at"])
        return Response(self.get_serializer(message).data)


class AdminSeedReviewView(APIView):
    """Return the manual-review gate for data created by ``seed_data``."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(seed_review_report(), status=status.HTTP_200_OK)


# --- Plain-Django error handlers (wired in config/urls.py) ------------------


def problem_bad_request(request, exception=None) -> JsonResponse:
    return problem_json_response(request, 400, "The request could not be understood.")


def problem_not_found(request, exception=None) -> JsonResponse:
    return problem_json_response(request, 404, "The requested resource was not found.")


def problem_server_error(request) -> JsonResponse:
    return problem_json_response(request, 500, "An unexpected error occurred.")
