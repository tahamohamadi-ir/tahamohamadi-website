"""CMS views.

Provides:
- ``AdminPageViewSet`` — ModelViewSet for CRUD operations on Pages (authenticated).
- ``PublicPageView`` — Read-only endpoint for published pages (anonymous).

Auth/CSRF enforcement: DRF defaults (SessionAuthentication + IsAuthenticated)
are applied globally; PublicPageView explicitly sets AllowAny + no auth classes.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from apps.cms.models import Page
from apps.cms.serializers import (
    PageListSerializer,
    PageSerializer,
    PublicPageSerializer,
)
from apps.cms.services import validate_page_composition
from apps.core.exceptions import build_problem, PROBLEM_CONTENT_TYPE
from apps.core.services import ConflictError, save_with_optimistic_lock


class AdminPageViewSet(ModelViewSet):
    """Admin CRUD for CMS pages with nested composition.

    - list: lightweight page list (no nested sections/blocks)
    - retrieve/create/update: full page with nested sections/blocks
    - filter by: status, page_type
    - search by: title_fa, title_en, slug_fa, slug_en
    - create: validates composition, then saves via serializer
    - update: validates composition, uses optimistic locking via version field
    """

    queryset = Page.objects.all()
    filterset_fields = ["status", "page_type"]
    search_fields = ["title_fa", "title_en", "slug_fa", "slug_en"]
    filter_backends = [DjangoFilterBackend, SearchFilter]

    def get_serializer_class(self):
        if self.action == "list":
            return PageListSerializer
        return PageSerializer

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validate composition before persisting
        sections_data = request.data.get("sections", [])
        composition_errors = validate_page_composition({"sections": sections_data})
        if composition_errors:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Page composition validation failed.",
                instance=request.path,
                errors={"composition": composition_errors},
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

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

        # Validate composition before persisting
        sections_data = request.data.get("sections", [])
        composition_errors = validate_page_composition({"sections": sections_data})
        if composition_errors:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Page composition validation failed.",
                instance=request.path,
                errors={"composition": composition_errors},
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

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
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Public Views (anonymous)
# ---------------------------------------------------------------------------


class PublicPageView(APIView):
    """Public endpoint: retrieve a published page by slug.

    Returns the full public projection of a published page including only
    enabled sections (ordered) and blocks with known block_types (fail-closed).

    Query parameters:
        locale: "en" (default) or "fa" — determines which slug field to match.

    Response:
        200: Page data with public projection.
        404: Problem Details if page not found or not published.

    Requirements:
        4.8: Public projection endpoint with published pages, enabled sections,
             valid blocks only.
        4.9: Exclude unknown block types from public responses (fail-closed).
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, slug: str):
        locale = request.query_params.get("locale", "en")

        if locale == "fa":
            page = Page.objects.filter(slug_fa=slug, status="published").first()
        else:
            page = Page.objects.filter(slug_en=slug, status="published").first()

        if not page:
            problem = build_problem(
                status.HTTP_404_NOT_FOUND,
                "Page not found or not published.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_404_NOT_FOUND,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        serializer = PublicPageSerializer(page)
        return Response(serializer.data)
