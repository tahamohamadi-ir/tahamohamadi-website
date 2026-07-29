from rest_framework import status
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from apps.core.exceptions import build_problem, PROBLEM_CONTENT_TYPE
from apps.core.services import ConflictError, save_with_optimistic_lock

from apps.identity.models import SiteProfile, Skill, SocialLink
from apps.identity.serializers import (
    PublicIdentitySerializer,
    PublicSkillSerializer,
    PublicSocialLinkSerializer,
    SiteProfileAdminSerializer,
    SkillAdminSerializer,
    SocialLinkAdminSerializer,
)


class IdentityAdminViewSet(ModelViewSet):
    """Shared CRUD implementation with optimistic-lock protection."""

    filterset_fields = ["status"]
    filter_backends = [DjangoFilterBackend, SearchFilter]

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


class AdminSiteProfileViewSet(IdentityAdminViewSet):
    queryset = SiteProfile.objects.all()
    serializer_class = SiteProfileAdminSerializer
    search_fields = ["name_fa", "name_en", "public_email"]

    def create(self, request, *args, **kwargs):
        if SiteProfile.objects.exists():
            problem = build_problem(
                status.HTTP_409_CONFLICT,
                "Only one site profile may exist.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_409_CONFLICT,
                content_type=PROBLEM_CONTENT_TYPE,
            )
        return super().create(request, *args, **kwargs)


class AdminSocialLinkViewSet(IdentityAdminViewSet):
    queryset = SocialLink.objects.all()
    serializer_class = SocialLinkAdminSerializer
    search_fields = ["label_fa", "label_en", "url"]


class AdminSkillViewSet(IdentityAdminViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillAdminSerializer
    search_fields = ["name_fa", "name_en", "category_fa", "category_en"]


class PublicIdentityView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        locale = request.query_params.get("locale", "en")
        if locale not in {"fa", "en"}:
            locale = "en"
        profile = SiteProfile.objects.filter(status="published").select_related("portrait").first()
        if profile is None:
            return Response({"profile": None, "social_links": [], "skills": []})
        context = {"locale": locale, "request": request}
        return Response({
            "profile": PublicIdentitySerializer(profile, context=context).data,
            "social_links": PublicSocialLinkSerializer(
                SocialLink.objects.filter(status="published"), many=True, context=context
            ).data,
            "skills": PublicSkillSerializer(
                Skill.objects.filter(status="published"), many=True, context=context
            ).data,
        })
