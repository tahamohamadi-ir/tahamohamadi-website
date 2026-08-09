from rest_framework import status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from django.db import IntegrityError, transaction

from django_filters.rest_framework import DjangoFilterBackend

from apps.core.exceptions import PROBLEM_CONTENT_TYPE, build_problem
from apps.core.permissions import IsAdminRole
from apps.core.services import ConflictError, save_with_optimistic_lock
from apps.identity.public import public_identity_payload
from apps.siteconfig.models import NavigationItem, RedirectRule, SiteSettings
from apps.siteconfig.serializers import (
    NavigationItemAdminSerializer,
    PublicNavigationItemSerializer,
    PublicSiteSettingsSerializer,
    RedirectRuleAdminSerializer,
    SiteConfigAdminSerializer,
)
from apps.siteconfig.services import conditional_public_response, public_site_payload


class SiteConfigAdminViewSet(ModelViewSet):
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    ordering_fields = "__all__"

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        incoming_version = request.data.get("version")
        if incoming_version is None:
            problem = build_problem(status.HTTP_400_BAD_REQUEST, "Field 'version' is required for updates (optimistic locking).", instance=request.path)
            return Response(problem, status=status.HTTP_400_BAD_REQUEST, content_type=PROBLEM_CONTENT_TYPE)
        try:
            save_with_optimistic_lock(instance, int(incoming_version), {})
        except (ConflictError, ValueError) as exc:
            if isinstance(exc, ConflictError):
                problem = build_problem(status.HTTP_409_CONFLICT, str(exc), instance=request.path, extra={"current_version": exc.current_version})
                return Response(problem, status=status.HTTP_409_CONFLICT, content_type=PROBLEM_CONTENT_TYPE)
            problem = build_problem(status.HTTP_400_BAD_REQUEST, "Field 'version' must be an integer.", instance=request.path)
            return Response(problem, status=status.HTTP_400_BAD_REQUEST, content_type=PROBLEM_CONTENT_TYPE)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop("partial", False))
        serializer.is_valid(raise_exception=True)
        serializer.validated_data.pop("version", None)
        self.perform_update(serializer)
        return Response(serializer.data)


class AdminSiteSettingsViewSet(SiteConfigAdminViewSet):
    queryset = SiteSettings.objects.select_related("default_og_image").all()
    serializer_class = SiteConfigAdminSerializer
    search_fields = ["site_title_fa", "site_title_en", "public_email"]

    def create(self, request, *args, **kwargs):
        if SiteSettings.objects.exists():
            problem = build_problem(status.HTTP_409_CONFLICT, "Only one site settings record may exist.", instance=request.path)
            return Response(problem, status=status.HTTP_409_CONFLICT, content_type=PROBLEM_CONTENT_TYPE)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                self.perform_create(serializer)
        except IntegrityError:
            problem = build_problem(status.HTTP_409_CONFLICT, "Only one site settings record may exist.", instance=request.path)
            return Response(problem, status=status.HTTP_409_CONFLICT, content_type=PROBLEM_CONTENT_TYPE)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=self.get_success_headers(serializer.data))


class AdminNavigationItemViewSet(SiteConfigAdminViewSet):
    queryset = NavigationItem.objects.all()
    serializer_class = NavigationItemAdminSerializer
    filterset_fields = ["status", "location"]
    search_fields = ["label_fa", "label_en", "href"]


class AdminRedirectRuleViewSet(SiteConfigAdminViewSet):
    queryset = RedirectRule.objects.all()
    serializer_class = RedirectRuleAdminSerializer
    filterset_fields = ["is_active", "status_code"]
    search_fields = ["source_path", "target_url"]


class PublicSiteConfigView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        locale = request.query_params.get("locale", "en")
        if locale not in {"fa", "en"}:
            locale = "en"
        return conditional_public_response(request, public_site_payload(locale, request))


class PublicSiteAggregateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        locale = request.query_params.get("locale", "en")
        if locale not in {"fa", "en"}:
            locale = "en"
        return conditional_public_response(request, {
            "site": public_site_payload(locale, request),
            "identity": public_identity_payload(locale, request),
        })
