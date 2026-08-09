"""Views for workflow module.

Admin API views for managing workflow transitions, revisions,
scheduled publishing, audit events, and preview tokens.

Endpoints:
- POST   /api/admin/workflow/transition/        — Execute a state transition
- GET    /api/admin/workflow/revisions/          — List revisions for an entity
- GET    /api/admin/workflow/revisions/compare/  — Compare two revisions
- POST   /api/admin/workflow/revisions/restore/  — Restore a revision as new draft
- GET    /api/admin/workflow/scheduled/          — List scheduled publish jobs
- DELETE /api/admin/workflow/scheduled/{id}/     — Cancel a pending scheduled publish
- POST   /api/admin/workflow/schedule/           — Create a scheduled publish
- POST   /api/admin/workflow/schedule/cancel/    — Cancel via POST (legacy)
- GET    /api/admin/workflow/audit-events/       — List audit events for an entity
- POST   /api/admin/workflow/preview-token/      — Generate a preview token
- POST   /api/admin/workflow/preview-token/revoke/ — Revoke a preview token
- GET    /api/public/workflow/preview/?token=... — View content via preview token

Requirements: 1.3, 8.1, 8.4, 8.5, 8.6, 8.7, 12.7
"""

from __future__ import annotations

import uuid

from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PROBLEM_CONTENT_TYPE, build_problem
from apps.workflow.models import Revision, ScheduledPublish
from apps.workflow.serializers import RevisionSerializer, ScheduledPublishSerializer
from apps.workflow.services import (
    PermissionDenied as WorkflowPermissionDenied,
    Success,
    TransitionError,
    compare_revisions,
    generate_preview_token,
    list_revisions,
    restore_revision,
    revoke_preview_token,
    transition_status,
)
from apps.workflow.preview import validate_preview_token


# ---------------------------------------------------------------------------
# Input Serializers
# ---------------------------------------------------------------------------


class TransitionInputSerializer(serializers.Serializer):
    """Input for workflow transition endpoint."""

    content_type = serializers.CharField(
        help_text="ContentType as 'app_label.model' (e.g., 'cms.page')."
    )
    object_id = serializers.UUIDField()
    target_status = serializers.ChoiceField(
        choices=["draft", "in_review", "scheduled", "published", "archived"],
    )
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class RestoreRevisionInputSerializer(serializers.Serializer):
    """Input for revision restore endpoint."""

    revision_id = serializers.UUIDField()


class ScheduleInputSerializer(serializers.Serializer):
    """Input for creating a scheduled publish."""

    content_type = serializers.CharField(
        help_text="ContentType as 'app_label.model' (e.g., 'cms.page')."
    )
    object_id = serializers.UUIDField()
    scheduled_at = serializers.DateTimeField()


class CancelScheduleInputSerializer(serializers.Serializer):
    """Input for cancelling a scheduled publish."""

    schedule_id = serializers.UUIDField()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _resolve_content_type(label: str) -> ContentType | None:
    """Resolve 'app_label.model' string to a ContentType instance."""
    parts = label.split(".")
    if len(parts) != 2:
        return None
    app_label, model = parts
    try:
        return ContentType.objects.get(app_label=app_label, model=model)
    except ContentType.DoesNotExist:
        return None


def _get_entity(content_type: ContentType, object_id: uuid.UUID):
    """Fetch the entity from the database given content type and object id."""
    model_class = content_type.model_class()
    if model_class is None:
        return None
    try:
        return model_class.objects.get(pk=object_id)
    except model_class.DoesNotExist:
        return None


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


class TransitionView(APIView):
    """POST /api/admin/workflow/transition/

    Execute a workflow state transition on any content entity.

    Accepts:
        content_type: str — 'app_label.model'
        object_id: UUID
        target_status: str
        scheduled_at: datetime (optional, required for 'scheduled')
        reason: str (optional)

    Returns:
        200 on success with updated entity status
        400 on TransitionError
        403 on PermissionDenied
    """

    def post(self, request):
        serializer = TransitionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Resolve content type
        ct = _resolve_content_type(data["content_type"])
        if ct is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Unknown content_type: '{data['content_type']}'. "
                f"Use format 'app_label.model'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Fetch entity
        entity = _get_entity(ct, data["object_id"])
        if entity is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Entity not found: {data['content_type']} "
                f"with id '{data['object_id']}'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Execute transition
        result = transition_status(
            entity,
            data["target_status"],
            request.user,
            scheduled_at=data.get("scheduled_at"),
            reason=data.get("reason", ""),
        )

        if isinstance(result, TransitionError):
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                result.message,
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        if isinstance(result, WorkflowPermissionDenied):
            problem = build_problem(
                status.HTTP_403_FORBIDDEN,
                result.message,
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_403_FORBIDDEN,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Success
        return Response(
            {
                "status": result.entity.status,
                "object_id": str(result.entity.pk),
                "content_type": data["content_type"],
            },
            status=status.HTTP_200_OK,
        )


class RevisionListView(APIView):
    """GET /api/admin/workflow/revisions/?content_type=...&object_id=...

    List revisions for a given entity, paginated.
    """

    def get(self, request):
        content_type_label = request.query_params.get("content_type")
        object_id_str = request.query_params.get("object_id")

        if not content_type_label or not object_id_str:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Both 'content_type' and 'object_id' query parameters are required.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Validate UUID
        try:
            object_id = uuid.UUID(object_id_str)
        except ValueError:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid UUID for object_id: '{object_id_str}'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Resolve content type
        ct = _resolve_content_type(content_type_label)
        if ct is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Unknown content_type: '{content_type_label}'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Fetch revisions via service
        revisions_qs = list_revisions(ct, object_id)

        # Use DRF pagination
        from apps.core.pagination import DefaultPageNumberPagination

        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(revisions_qs, request, view=self)

        if page is not None:
            serializer = RevisionSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = RevisionSerializer(revisions_qs, many=True)
        return Response(serializer.data)


class RevisionCompareView(APIView):
    """GET /api/admin/workflow/revisions/compare/?a=...&b=...

    Compare two revisions and return field-level diff data.
    """

    def get(self, request):
        a_str = request.query_params.get("a")
        b_str = request.query_params.get("b")

        if not a_str or not b_str:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Both 'a' and 'b' query parameters (revision UUIDs) are required.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Validate UUIDs
        try:
            revision_id_a = uuid.UUID(a_str)
            revision_id_b = uuid.UUID(b_str)
        except ValueError:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Invalid UUID format for 'a' or 'b' parameter.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        try:
            diff = compare_revisions(revision_id_a, revision_id_b)
        except Revision.DoesNotExist:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "One or both revision IDs not found.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Serialize UUIDs in diff response
        diff["revision_a"] = str(diff["revision_a"])
        diff["revision_b"] = str(diff["revision_b"])

        return Response(diff, status=status.HTTP_200_OK)


class RevisionRestoreView(APIView):
    """POST /api/admin/workflow/revisions/restore/

    Restore a revision as a new draft entity.
    """

    def post(self, request):
        serializer = RestoreRevisionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        revision_id = serializer.validated_data["revision_id"]

        try:
            new_entity = restore_revision(revision_id, request.user)
        except Revision.DoesNotExist:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Revision '{revision_id}' not found.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )
        except ValueError as exc:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                str(exc),
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        return Response(
            {
                "id": str(new_entity.pk),
                "status": getattr(new_entity, "status", "draft"),
                "version": getattr(new_entity, "version", 1),
            },
            status=status.HTTP_200_OK,
        )


class ScheduleCreateView(APIView):
    """POST /api/admin/workflow/schedule/

    Create a scheduled publish record directly.
    """

    def post(self, request):
        serializer = ScheduleInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Resolve content type
        ct = _resolve_content_type(data["content_type"])
        if ct is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Unknown content_type: '{data['content_type']}'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Create ScheduledPublish record
        scheduled = ScheduledPublish.objects.create(
            content_type=ct,
            object_id=data["object_id"],
            scheduled_at=data["scheduled_at"],
        )

        output = ScheduledPublishSerializer(scheduled)
        return Response(output.data, status=status.HTTP_201_CREATED)


class ScheduleCancelView(APIView):
    """POST /api/admin/workflow/schedule/cancel/

    Cancel a pending scheduled publish by setting its status to 'cancelled'.
    """

    def post(self, request):
        serializer = CancelScheduleInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        schedule_id = serializer.validated_data["schedule_id"]

        try:
            scheduled = ScheduledPublish.objects.get(pk=schedule_id)
        except ScheduledPublish.DoesNotExist:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Scheduled publish '{schedule_id}' not found.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        if scheduled.status != "pending":
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot cancel schedule with status '{scheduled.status}'. "
                f"Only 'pending' schedules can be cancelled.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        scheduled.status = "cancelled"
        scheduled.save(update_fields=["status"])

        output = ScheduledPublishSerializer(scheduled)
        return Response(output.data, status=status.HTTP_200_OK)


class ScheduledListView(APIView):
    """GET /api/admin/workflow/scheduled/

    List scheduled publish jobs, filterable by status (pending, completed, failed).
    Returns a paginated list.
    """

    def get(self, request):
        queryset = ScheduledPublish.objects.all()

        # Filter by status if provided
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        from apps.core.pagination import DefaultPageNumberPagination

        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        if page is not None:
            serializer = ScheduledPublishSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ScheduledPublishSerializer(queryset, many=True)
        return Response(serializer.data)


class ScheduledDeleteView(APIView):
    """DELETE /api/admin/workflow/scheduled/{id}/

    Cancel a pending scheduled publish by deleting it.
    Only cancels if status is "pending".
    """

    def delete(self, request, pk: uuid.UUID):
        try:
            scheduled = ScheduledPublish.objects.get(pk=pk)
        except ScheduledPublish.DoesNotExist:
            problem = build_problem(
                status.HTTP_404_NOT_FOUND,
                f"Scheduled publish '{pk}' not found.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_404_NOT_FOUND,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        if scheduled.status != "pending":
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot cancel schedule with status '{scheduled.status}'. "
                f"Only 'pending' schedules can be cancelled.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        scheduled.status = "cancelled"
        scheduled.save(update_fields=["status"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class AuditEventListView(APIView):
    """GET /api/admin/workflow/audit-events/?content_type=...&object_id=...

    List audit events for a given entity, ordered by timestamp desc (default).
    Returns a paginated list.
    """

    def get(self, request):
        from apps.workflow.models import AuditEvent
        from apps.workflow.serializers import AuditEventSerializer

        content_type_label = request.query_params.get("content_type")
        object_id_str = request.query_params.get("object_id")

        if not content_type_label or not object_id_str:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Both 'content_type' and 'object_id' query parameters are required.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Validate UUID
        try:
            object_id = uuid.UUID(object_id_str)
        except ValueError:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid UUID for object_id: '{object_id_str}'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Resolve content type
        ct = _resolve_content_type(content_type_label)
        if ct is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Unknown content_type: '{content_type_label}'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Fetch audit events (ordered by timestamp desc via model Meta)
        queryset = AuditEvent.objects.filter(
            content_type=ct,
            object_id=object_id,
        )

        from apps.core.pagination import DefaultPageNumberPagination

        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        if page is not None:
            serializer = AuditEventSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AuditEventSerializer(queryset, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Preview Token Views (Requirement 8.7)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Translation Status View (Requirements 8.8, 8.9)
# ---------------------------------------------------------------------------


class TranslationStatusView(APIView):
    """GET /api/admin/workflow/translation-status/

    Returns the translation status for all content entities across all models.
    Used by the admin Translation Queue UI.

    Response format:
    [
        {
            "id": "uuid",
            "content_type": "cms.page",
            "title_en": "...",
            "title_fa": "...",
            "status_en": "complete|incomplete|missing|outdated",
            "status_fa": "complete|incomplete|missing|outdated",
            "last_updated": "ISO timestamp"
        }
    ]
    """

    def get(self, request):
        from apps.blog.models import Article
        from apps.cms.models import Page
        from apps.portfolio.models import CaseStudy
        from apps.workflow.services import compute_translation_status

        items = []

        # Collect translation status from all content models
        content_models = [
            ("cms.page", Page, "/admin/pages", ("title",)),
            ("blog.article", Article, "/admin/blog", ("title", "excerpt")),
            (
                "portfolio.casestudy",
                CaseStudy,
                "/admin/portfolio",
                ("title", "role", "outcome"),
            ),
        ]

        for content_type, model_class, action_base, field_names in content_models:
            for entity in model_class.objects.order_by("-updated_at", "id")[:100]:
                status_en = compute_translation_status(entity, "en")
                status_fa = compute_translation_status(entity, "fa")
                fields = [
                    {
                        "key": field_name,
                        "label": field_name.replace("_", " ").title(),
                        "en": getattr(entity, f"{field_name}_en", ""),
                        "fa": getattr(entity, f"{field_name}_fa", ""),
                    }
                    for field_name in field_names
                ]

                items.append({
                    "id": str(entity.pk),
                    "content_type": content_type,
                    "title_en": getattr(entity, "title_en", ""),
                    "title_fa": getattr(entity, "title_fa", ""),
                    "status_en": status_en,
                    "status_fa": status_fa,
                    "last_updated": entity.updated_at.isoformat(),
                    "action_path": f"{action_base}/{entity.pk}",
                    "fields": fields,
                })

        return Response(items, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Preview Token Views (Requirement 8.7)
# ---------------------------------------------------------------------------


class PreviewTokenGenerateInputSerializer(serializers.Serializer):
    """Input for generating a preview token."""

    content_type = serializers.CharField(
        help_text="ContentType as 'app_label.model' (e.g., 'cms.page')."
    )
    object_id = serializers.UUIDField()
    locale = serializers.ChoiceField(choices=["fa", "en"])


class PreviewTokenRevokeInputSerializer(serializers.Serializer):
    """Input for revoking a preview token."""

    token = serializers.CharField()


class PreviewTokenGenerateView(APIView):
    """POST /api/admin/workflow/preview-token/

    Generate a short-lived (15-minute), locale-specific preview token for
    viewing unpublished content. The token is not logged or cached.

    Requirement 8.7.

    Accepts:
        content_type: str — 'app_label.model'
        object_id: UUID
        locale: str — 'fa' or 'en'

    Returns:
        200 with { token: str, expires_in: int } on success
        400 on validation error
    """

    def post(self, request):
        serializer = PreviewTokenGenerateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Resolve content type
        ct = _resolve_content_type(data["content_type"])
        if ct is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Unknown content_type: '{data['content_type']}'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Fetch entity
        entity = _get_entity(ct, data["object_id"])
        if entity is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                f"Entity not found: {data['content_type']} "
                f"with id '{data['object_id']}'.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Generate the preview token
        token = generate_preview_token(entity, data["locale"], user=request.user)

        return Response(
            {
                "token": token,
                "locale": data["locale"],
                "expires_in": 900,  # 15 minutes in seconds
            },
            status=status.HTTP_200_OK,
        )


class PreviewTokenRevokeView(APIView):
    """POST /api/admin/workflow/preview-token/revoke/

    Revoke a previously issued preview token so it can no longer be used.

    Requirement 8.7: Tokens are revocable.

    Accepts:
        token: str — the preview token to revoke

    Returns:
        200 on success
    """

    def post(self, request):
        serializer = PreviewTokenRevokeInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        revoke_preview_token(token)

        return Response(
            {"detail": "Token revoked."},
            status=status.HTTP_200_OK,
        )


class PreviewContentView(APIView):
    """GET /api/public/preview/?token=...

    Validate a preview token and return the associated content (draft/scheduled)
    for the token's locale. Responses include security headers per Requirement 12.7:
    - X-Robots-Tag: noindex
    - Cache-Control: no-store

    This endpoint is public (no session auth required) — the token itself is the
    credential. It allows viewing draft/scheduled content for a specific locale.

    Returns:
        200 with serialized content on valid token
        401 on invalid, expired, or revoked token
    """

    # No authentication required — the token is the credential
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        token = request.query_params.get("token")

        if not token:
            problem = build_problem(
                status.HTTP_401_UNAUTHORIZED,
                "Preview token is required. Pass it as ?token=... query parameter.",
                instance=request.path,
            )
            response = Response(
                problem,
                status=status.HTTP_401_UNAUTHORIZED,
                content_type=PROBLEM_CONTENT_TYPE,
            )
            response["X-Robots-Tag"] = "noindex"
            response["Cache-Control"] = "no-store"
            return response

        # Validate the token (no entity/locale args = returns PreviewTokenData)
        result = validate_preview_token(token)

        if result is None:
            problem = build_problem(
                status.HTTP_401_UNAUTHORIZED,
                "Invalid, expired, or revoked preview token.",
                instance=request.path,
            )
            response = Response(
                problem,
                status=status.HTTP_401_UNAUTHORIZED,
                content_type=PROBLEM_CONTENT_TYPE,
            )
            response["X-Robots-Tag"] = "noindex"
            response["Cache-Control"] = "no-store"
            return response

        # Token is valid — serialize the entity
        entity = result.entity
        locale = result.locale

        # Resolve the appropriate serializer for the entity
        from django.contrib.contenttypes.models import ContentType as CT

        ct = CT.objects.get_for_model(entity)
        model_label = f"{ct.app_label}.{ct.model}"

        content_data = _serialize_preview_content(
            entity,
            model_label,
            locale,
            request=request,
        )

        response = Response(
            {
                "content_type": model_label,
                "object_id": str(entity.pk),
                "locale": locale,
                "status": getattr(entity, "status", "unknown"),
                "data": content_data,
            },
            status=status.HTTP_200_OK,
        )
        # Requirement 12.7: Preview responses include noindex and no-store
        response["X-Robots-Tag"] = "noindex"
        response["Cache-Control"] = "no-store"
        return response


def _serialize_preview_content(entity, model_label: str, locale: str, request=None) -> dict:
    """Serialize an entity for preview using its registered DRF serializer.

    Falls back to a basic dict representation if no serializer is registered.
    """
    if model_label == "cms.page":
        from apps.cms.serializers import PublicPageSerializer

        return PublicPageSerializer(
            entity,
            context={"locale": locale, "request": request},
        ).data

    from apps.workflow.services import _get_serializer_map

    serializer_map = _get_serializer_map()
    dotted_path = serializer_map.get(model_label)

    if dotted_path is None:
        # Fallback: return basic info
        return {
            "id": str(entity.pk),
            "status": getattr(entity, "status", "unknown"),
        }

    from importlib import import_module

    module_path, class_name = dotted_path.rsplit(".", 1)
    module = import_module(module_path)
    serializer_class = getattr(module, class_name)

    serializer = serializer_class(entity)
    return serializer.data
