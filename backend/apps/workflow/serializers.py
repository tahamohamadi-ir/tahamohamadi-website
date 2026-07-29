"""Serializers for workflow models.

Provides DRF serializers as DTOs for workflow transitions, revisions,
scheduled publishing, audit events, and preview tokens.
"""

from rest_framework import serializers

from .models import AuditEvent, PreviewToken, Revision, ScheduledPublish


class RevisionSerializer(serializers.ModelSerializer):
    """Read-only serializer for revision snapshots."""

    content_type_label = serializers.StringRelatedField(source="content_type")

    class Meta:
        model = Revision
        fields = [
            "id",
            "content_type_label",
            "object_id",
            "snapshot",
            "label",
            "created_at",
            "created_by",
        ]
        read_only_fields = fields


class ScheduledPublishSerializer(serializers.ModelSerializer):
    """Serializer for scheduled publish jobs."""

    class Meta:
        model = ScheduledPublish
        fields = [
            "id",
            "object_id",
            "scheduled_at",
            "timezone",
            "status",
            "attempts",
            "last_error",
        ]
        read_only_fields = ["id", "status", "attempts", "last_error"]


class AuditEventSerializer(serializers.ModelSerializer):
    """Read-only serializer for audit trail events."""

    user_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditEvent
        fields = [
            "id",
            "object_id",
            "user_display",
            "from_status",
            "to_status",
            "reason",
            "timestamp",
        ]
        read_only_fields = fields

    def get_user_display(self, obj: AuditEvent) -> str:
        if obj.user:
            return obj.user.get_username()
        return "system"


class WorkflowTransitionSerializer(serializers.Serializer):
    """Input serializer for requesting a workflow state transition."""

    target_status = serializers.ChoiceField(
        choices=["in_review", "scheduled", "published", "archived", "draft"],
    )
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class PreviewTokenSerializer(serializers.ModelSerializer):
    """Read-only serializer for preview token records."""

    content_type_label = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = PreviewToken
        fields = [
            "id",
            "token",
            "content_type_label",
            "object_id",
            "locale",
            "created_at",
            "expires_at",
            "revoked",
            "is_expired",
            "is_valid",
        ]
        read_only_fields = fields

    def get_content_type_label(self, obj: PreviewToken) -> str:
        ct = obj.content_type
        return f"{ct.app_label}.{ct.model}"
