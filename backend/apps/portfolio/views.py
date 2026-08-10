"""Portfolio views.

Provides:
- ``AdminCaseStudyViewSet`` — ModelViewSet for CRUD operations on case studies
  with nested narrative blocks and gallery management (authenticated).
- ``PublicCaseStudyListView`` — Read-only list of published case studies (anonymous).
- ``PublicCaseStudyDetailView`` — Read-only detail of a published case study (anonymous).

Auth/CSRF enforcement: DRF defaults (SessionAuthentication + IsAuthenticated)
are applied globally; Public views explicitly set AllowAny + no auth classes.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from django.db import NotSupportedError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied

from apps.core.permissions import IsContentEditorRole, Roles, user_has_role
from apps.core.exceptions import build_problem, PROBLEM_CONTENT_TYPE
from apps.core.services import ConflictError, save_with_optimistic_lock
from apps.media.models import MediaAsset
from apps.portfolio.models import CaseStudy
from apps.portfolio.serializers import (
    CaseStudyListSerializer,
    CaseStudySerializer,
    PublicCaseStudyListSerializer,
    PublicCaseStudySerializer,
)


class AdminCaseStudyViewSet(ModelViewSet):
    """Admin CRUD for portfolio case studies with nested narrative blocks.

    - list: lightweight case study list (no nested blocks/gallery)
    - retrieve: full case study with narrative blocks + gallery
    - create: validates, saves with nested blocks
    - update: optimistic locking (version), replaces narrative blocks
    - delete: standard destroy
    - manage_gallery (custom action): add/remove gallery items

    Filters: status, featured, technologies (JSON contains)
    Search: title_fa, title_en, slug_fa, slug_en

    Requirements: 1.3, 7.1
    """

    permission_classes = [IsContentEditorRole]
    queryset = CaseStudy.objects.all().order_by("-created_at")
    filterset_fields = ["status", "featured"]
    search_fields = ["title_fa", "title_en", "slug_fa", "slug_en"]
    filter_backends = [DjangoFilterBackend, SearchFilter]

    def get_serializer_class(self):
        if self.action == "list":
            return CaseStudyListSerializer
        return CaseStudySerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by technologies (JSON list contains)
        technologies = self.request.query_params.get("technologies")
        if technologies:
            tech_list = [t.strip() for t in technologies.split(",") if t.strip()]
            for tech in tech_list:
                try:
                    q = queryset.filter(technologies__contains=[tech])
                    bool(q[:1])
                    queryset = q
                except NotSupportedError:
                    queryset = queryset.filter(technologies__icontains=tech)

        return queryset

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data.get("status")
        if new_status in ["PUBLISHED", "SCHEDULED"] and not user_has_role(request.user, Roles.PUBLISHER):
            raise PermissionDenied("You do not have permission to publish or schedule content.")

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    # ------------------------------------------------------------------
    # Update (with optimistic locking)
    # ------------------------------------------------------------------

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Extract version from validated serializer data for optimistic locking
        incoming_version = serializer.validated_data.get("version")
        if incoming_version is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Field 'version' is required for updates (optimistic locking).",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Use optimistic locking: check version, then delegate to serializer
        try:
            save_with_optimistic_lock(instance, incoming_version, {})
        except ConflictError as exc:
            problem = build_problem(
                status.HTTP_409_CONFLICT,
                str(exc),
                instance=request.path,
                extra={"current_version": exc.current_version},
            )
            return Response(
                problem,
                status=status.HTTP_409_CONFLICT,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Version check passed — now perform the actual serializer update.
        # Reload instance to get the incremented version from optimistic lock.
        instance.refresh_from_db()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data.get("status")
        if new_status in ["PUBLISHED", "SCHEDULED"] and instance.status != new_status:
            if not user_has_role(request.user, Roles.PUBLISHER):
                raise PermissionDenied("You do not have permission to publish or schedule content.")

        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    # ------------------------------------------------------------------
    # Gallery Management (custom action)
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="manage-gallery")
    def manage_gallery(self, request, pk=None):
        """Add or remove gallery items from a case study.

        Request body:
            {
                "add": [<media_asset_id>, ...],
                "remove": [<media_asset_id>, ...]
            }

        Both fields are optional. IDs that don't exist are silently skipped.
        """
        case_study = self.get_object()

        add_ids = request.data.get("add", [])
        remove_ids = request.data.get("remove", [])

        if not add_ids and not remove_ids:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "At least one of 'add' or 'remove' must be provided.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Add gallery items
        if add_ids:
            assets_to_add = MediaAsset.objects.filter(id__in=add_ids)
            case_study.gallery.add(*assets_to_add)

        # Remove gallery items
        if remove_ids:
            assets_to_remove = MediaAsset.objects.filter(id__in=remove_ids)
            case_study.gallery.remove(*assets_to_remove)

        # Return updated case study
        serializer = CaseStudySerializer(case_study, context={"request": request})
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Public Views (anonymous)
# ---------------------------------------------------------------------------


class PublicCaseStudyListView(ListAPIView):
    """Public endpoint: list published case studies with filtering and pagination.

    Returns published case studies ordered by most recent publication date.

    Query parameters:
        featured: "true"/"false" — filter by featured flag.
        technologies: comma-separated list — filter by technologies (AND).

    Response:
        200: Paginated list of case studies (metadata only, no blocks).

    Requirements: 7.5, 1.3
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []
    serializer_class = PublicCaseStudyListSerializer

    def get_queryset(self):
        queryset = CaseStudy.objects.filter(status="published").order_by(
            "-published_at"
        )

        # Filter by featured
        featured = self.request.query_params.get("featured")
        if featured is not None:
            if featured.lower() in ("true", "1"):
                queryset = queryset.filter(featured=True)
            elif featured.lower() in ("false", "0"):
                queryset = queryset.filter(featured=False)

        # Filter by technologies (comma-separated, AND logic)
        technologies = self.request.query_params.get("technologies")
        if technologies:
            tech_list = [t.strip() for t in technologies.split(",") if t.strip()]
            for tech in tech_list:
                try:
                    q = queryset.filter(technologies__contains=[tech])
                    bool(q[:1])
                    queryset = q
                except NotSupportedError:
                    queryset = queryset.filter(technologies__icontains=tech)

        # Filter by role (checks both FA and EN)
        role = self.request.query_params.get("role")
        if role:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(role_fa__iexact=role) | Q(role_en__iexact=role)
            )

        return queryset


class PublicCaseStudyDetailView(APIView):
    """Public endpoint: retrieve a published case study by slug.

    Locale-aware slug lookup: locale=fa uses slug_fa, locale=en uses slug_en.
    Passes locale to serializer context for narrative block filtering.

    Query parameters:
        locale: "en" (default) or "fa" — determines slug field and block locale.

    Response:
        200: Full case study with locale-filtered narrative blocks.
        404: Problem Details if case study not found or not published.

    Requirements: 7.5, 1.3
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, slug: str):
        locale = request.query_params.get("locale", "en")

        if locale == "fa":
            case_study = CaseStudy.objects.filter(
                slug_fa=slug, status="published"
            ).first()
        else:
            case_study = CaseStudy.objects.filter(
                slug_en=slug, status="published"
            ).first()

        if not case_study:
            problem = build_problem(
                status.HTTP_404_NOT_FOUND,
                "Case study not found or not published.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_404_NOT_FOUND,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        serializer = PublicCaseStudySerializer(
            case_study, context={"locale": locale}
        )
        return Response(serializer.data)
