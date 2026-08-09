"""CMS views.

Provides:
- ``AdminPageViewSet`` — ModelViewSet for CRUD operations on Pages (authenticated).
- ``PublicPageView`` — Read-only endpoint for published pages (anonymous).

Auth/CSRF enforcement: DRF defaults (SessionAuthentication + IsAuthenticated)
are applied globally; PublicPageView explicitly sets AllowAny + no auth classes.
"""

from __future__ import annotations

from django.db import transaction

from rest_framework import status
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied

from apps.core.permissions import IsContentEditorRole, Roles, user_has_role
from apps.cms.models import ComposerTemplate, Page
from apps.cms.serializers import (
    ComposerTemplateImportSerializer,
    ComposerTemplateSerializer,
    PageListSerializer,
    PageSerializer,
    PublicPageSerializer,
)
from apps.cms.services import normalize_template_manifest, validate_page_composition
from apps.core.exceptions import build_problem, PROBLEM_CONTENT_TYPE
from apps.core.services import ConflictError, save_with_optimistic_lock
from apps.media.models import MediaAsset


class AdminPageViewSet(ModelViewSet):
    """Admin CRUD for CMS pages with nested composition.

    - list: lightweight page list (no nested sections/blocks)
    - retrieve/create/update: full page with nested sections/blocks
    - filter by: status, page_type
    - search by: title_fa, title_en, slug_fa, slug_en
    - create: validates composition, then saves via serializer
    - update: validates composition, uses optimistic locking via version field
    """

    permission_classes = [IsContentEditorRole]
    queryset = Page.objects.all().order_by("-updated_at", "id")
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
        composition_problem = _page_composition_problem(request)
        if composition_problem:
            return composition_problem

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data.get("status")
        if new_status in ["published", "scheduled"] and not user_has_role(request.user, Roles.PUBLISHER):
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

        composition_problem = _page_composition_problem(request)
        if composition_problem:
            return composition_problem

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
        # Check permission if status is changing to published or scheduled
        if new_status in ["published", "scheduled"] and instance.status != new_status:
            if not user_has_role(request.user, Roles.PUBLISHER):
                raise PermissionDenied("You do not have permission to publish or schedule content.")

        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)


def _active_media_ids() -> set[str]:
    return {
        str(media_id)
        for media_id in MediaAsset.objects.filter(status="active").values_list(
            "id", flat=True
        )
    }


def _page_composition_problem(request) -> Response | None:
    """Return the stable Problem Details response for invalid compositions."""
    composition_errors = validate_page_composition(
        {"sections": request.data.get("sections", [])},
        known_media_ids=_active_media_ids(),
    )
    if not composition_errors:
        return None

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


def _manifest_problem(request, errors: list[str]) -> Response:
    problem = build_problem(
        status.HTTP_400_BAD_REQUEST,
        "Template manifest validation failed.",
        instance=request.path,
        errors={"manifest": errors},
    )
    return Response(
        problem,
        status=status.HTTP_400_BAD_REQUEST,
        content_type=PROBLEM_CONTENT_TYPE,
    )


def _set_request_audit(
    request,
    *,
    target=None,
    action: str | None = None,
    reason: str | None = None,
    skip: bool = False,
) -> None:
    raw_request = getattr(request, "_request", request)
    if skip:
        setattr(raw_request, "_skip_audit_logging", True)
        return
    setattr(raw_request, "_audit_target", target)
    setattr(raw_request, "_audit_action", action)
    setattr(raw_request, "_audit_reason", reason)


class AdminComposerTemplateListCreateView(APIView):
    """List or store validated portable templates as Draft-only snapshots."""

    def get(self, request):
        templates = ComposerTemplate.objects.all()
        return Response(ComposerTemplateSerializer(templates, many=True).data)

    def post(self, request):
        normalized, errors = normalize_template_manifest(
            request.data.get("manifest"),
            known_media_ids=_active_media_ids(),
        )
        if errors:
            return _manifest_problem(request, errors)

        serializer = ComposerTemplateSerializer(
            data={"name": request.data.get("name"), "manifest": normalized}
        )
        serializer.is_valid(raise_exception=True)
        actor = request.user.get_username()
        template = serializer.save(created_by=actor, updated_by=actor)
        _set_request_audit(
            request,
            target=template,
            action="create",
            reason="Portable Composer template created.",
        )
        return Response(
            ComposerTemplateSerializer(template).data,
            status=status.HTTP_201_CREATED,
        )


class AdminComposerTemplateImportView(APIView):
    """Validate a portable manifest, then optionally create one new Draft Page."""

    def post(self, request):
        import_serializer = ComposerTemplateImportSerializer(data=request.data)
        import_serializer.is_valid(raise_exception=True)
        data = import_serializer.validated_data

        normalized, errors = normalize_template_manifest(
            data["manifest"],
            known_media_ids=_active_media_ids(),
        )
        if errors:
            return _manifest_problem(request, errors)

        page_payload = {
            "slug_fa": data["slug_fa"],
            "slug_en": data["slug_en"],
            "title_fa": data["title_fa"],
            "title_en": data["title_en"],
            "page_type": data["page_type"],
            "status": "draft",
            "sections": normalized["sections"],
        }
        page_serializer = PageSerializer(data=page_payload)
        page_serializer.is_valid(raise_exception=True)

        if data["dry_run"]:
            _set_request_audit(request, skip=True)
            return Response({"valid": True, "manifest": normalized})

        actor = request.user.get_username()
        with transaction.atomic():
            page = page_serializer.save(created_by=actor, updated_by=actor)
        _set_request_audit(
            request,
            target=page,
            action="import",
            reason="Portable Composer template imported as a new Draft page.",
        )
        return Response(
            {
                "valid": True,
                "manifest": normalized,
                "page": PageSerializer(page).data,
            },
            status=status.HTTP_201_CREATED,
        )


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
            page = (
                Page.objects.filter(slug_fa=slug, status="published")
                .prefetch_related("sections__blocks")
                .first()
            )
            if not page and not Page.objects.filter(slug_fa=slug).exists():
                # Public routes such as /fa/about have canonical English path
                # segments.  A real Persian slug always wins, including a
                # non-public one, so this cannot leak a different page.
                page = (
                    Page.objects.filter(slug_en=slug, status="published")
                    .prefetch_related("sections__blocks")
                    .first()
                )
        else:
            page = (
                Page.objects.filter(slug_en=slug, status="published")
                .prefetch_related("sections__blocks")
                .first()
            )


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

        serializer = PublicPageSerializer(page, context={"locale": locale, "request": request})
        return Response(serializer.data)


class PublicHomePageView(PublicPageView):
    """Public endpoint for the locale-root Home composition.

    Home is identified by its content type, not by a locale-specific slug.
    """

    def get(self, request, slug: str = ""):
        locale = request.query_params.get("locale", "en")
        page = (
            Page.objects.filter(page_type="home", status="published")
            .prefetch_related("sections__blocks")
            .order_by("-updated_at", "id")
            .first()
        )


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

        serializer = PublicPageSerializer(page, context={"locale": locale, "request": request})
        return Response(serializer.data)
