"""Page Builder views.

REST API endpoints for the visual page builder.

API Specification (from Blueprint Part 59):
  GET    /api/v1/builder/pages
  POST   /api/v1/builder/pages
  GET    /api/v1/builder/pages/{id}
  PATCH  /api/v1/builder/pages/{id}
  GET    /api/v1/builder/pages/{id}/draft
  PATCH  /api/v1/builder/pages/{id}/draft
  POST   /api/v1/builder/pages/{id}/validate
  GET    /api/v1/builder/pages/{id}/versions
  GET    /api/v1/builder/pages/{id}/versions/{versionId}
  POST   /api/v1/builder/pages/{id}/versions/{versionId}/restore
  POST   /api/v1/builder/pages/{id}/publish
"""

from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from apps.core.exceptions import build_problem, PROBLEM_CONTENT_TYPE
from apps.core.permissions import IsContentEditorRole
from apps.pages.models import BuilderPage, BuilderPageDraft, BuilderPageVersion
from apps.pages.schema_validator import validate_builder_schema
from apps.pages.serializers import (
    BuilderPageCreateSerializer,
    BuilderPageDetailSerializer,
    BuilderPageListSerializer,
    BuilderPageVersionSerializer,
    DraftPatchSerializer,
)


class BuilderPageViewSet(ModelViewSet):
    """Admin CRUD for builder pages.

    list:   lightweight page list (no schema)
    create: create page + initial draft
    retrieve/update: full page detail with draft
    """

    permission_classes = [IsContentEditorRole]
    queryset = BuilderPage.objects.all().order_by("-updated_at", "id")
    filterset_fields = ["status"]
    search_fields = ["title", "slug"]
    filter_backends = [DjangoFilterBackend, SearchFilter]

    def get_serializer_class(self):
        if self.action == "list":
            return BuilderPageListSerializer
        if self.action == "create":
            return BuilderPageCreateSerializer
        return BuilderPageDetailSerializer

    # ------------------------------------------------------------------
    # Draft endpoints
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get", "patch"], url_path="draft")
    def draft(self, request, pk=None):
        page = self.get_object()

        if request.method == "GET":
            draft = getattr(page, "draft", None)
            if not draft:
                return Response(
                    build_problem(
                        status.HTTP_404_NOT_FOUND,
                        "No draft found for this page.",
                        instance=request.path,
                    ),
                    status=status.HTTP_404_NOT_FOUND,
                    content_type=PROBLEM_CONTENT_TYPE,
                )
            from apps.pages.serializers import BuilderPageDraftSerializer

            return Response(BuilderPageDraftSerializer(draft).data)

        # PATCH: Autosave with optimistic concurrency (Blueprint Part 33)
        serializer = DraftPatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        draft, _ = BuilderPageDraft.objects.get_or_create(page=page)

        # Optimistic concurrency check
        if data["base_revision"] != draft.revision:
            return Response(
                build_problem(
                    status.HTTP_409_CONFLICT,
                    f"Revision conflict: expected {data['base_revision']}, "
                    f"current is {draft.revision}.",
                    instance=request.path,
                    extra={"current_revision": draft.revision},
                ),
                status=status.HTTP_409_CONFLICT,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Atomic update
        with transaction.atomic():
            draft.schema = data["schema"]
            draft.revision += 1
            draft.save()

        from apps.pages.serializers import BuilderPageDraftSerializer

        return Response(BuilderPageDraftSerializer(draft).data)

    # ------------------------------------------------------------------
    # Validate
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="validate")
    def validate_schema(self, request, pk=None):
        """Validate the current draft schema."""
        page = self.get_object()
        draft = getattr(page, "draft", None)

        if not draft:
            return Response(
                build_problem(
                    status.HTTP_404_NOT_FOUND,
                    "No draft found for this page.",
                    instance=request.path,
                ),
                status=status.HTTP_404_NOT_FOUND,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Basic schema validation
        errors = validate_builder_schema(draft.schema)

        return Response({
            "valid": len(errors) == 0,
            "errors": errors,
        })

    # ------------------------------------------------------------------
    # Versions
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get"], url_path="versions")
    def versions(self, request, pk=None):
        page = self.get_object()
        versions = page.versions.all().order_by("-version_number")
        serializer = BuilderPageVersionSerializer(versions, many=True)
        return Response(serializer.data)

    # ------------------------------------------------------------------
    # Publish
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        """Create an immutable version from the draft and publish it."""
        page = self.get_object()
        draft = getattr(page, "draft", None)

        if not draft:
            return Response(
                build_problem(
                    status.HTTP_400_BAD_REQUEST,
                    "No draft to publish.",
                    instance=request.path,
                ),
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Validate before publish
        errors = validate_builder_schema(draft.schema)
        if errors:
            return Response(
                build_problem(
                    status.HTTP_400_BAD_REQUEST,
                    "Schema validation failed. Cannot publish.",
                    instance=request.path,
                    errors={"validation": errors},
                ),
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        with transaction.atomic():
            # Determine next version number
            last_version = page.versions.order_by("-version_number").first()
            next_version = (last_version.version_number + 1) if last_version else 1

            # Create immutable version
            version = BuilderPageVersion.objects.create(
                page=page,
                version_number=next_version,
                schema=draft.schema,
                schema_version=draft.schema_version,
                content_hash=draft.content_hash,
                created_by=request.user if request.user.is_authenticated else None,
                reason="publish",
            )

            # Update page status
            page.status = "published"
            page.current_published_version = version
            page.published_at = timezone.now()
            page.save(update_fields=["status", "current_published_version", "published_at", "updated_at"])

        return Response(
            BuilderPageVersionSerializer(version).data,
            status=status.HTTP_201_CREATED,
        )



