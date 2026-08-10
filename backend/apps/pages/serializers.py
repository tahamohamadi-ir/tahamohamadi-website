"""Page Builder serializers.

DRF serializers for the visual page builder's REST API.
"""

from rest_framework import serializers

from apps.pages.models import BuilderPage, BuilderPageDraft, BuilderPageVersion


class BuilderPageDraftSerializer(serializers.ModelSerializer):
    """Serializer for the mutable draft schema."""

    class Meta:
        model = BuilderPageDraft
        fields = [
            "schema",
            "revision",
            "schema_version",
            "content_hash",
            "updated_at",
        ]
        read_only_fields = ["content_hash", "updated_at"]


class BuilderPageVersionSerializer(serializers.ModelSerializer):
    """Serializer for immutable page versions."""

    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True, default=None
    )

    class Meta:
        model = BuilderPageVersion
        fields = [
            "id",
            "version_number",
            "schema",
            "schema_version",
            "content_hash",
            "reason",
            "created_by_username",
            "created_at",
        ]
        read_only_fields = fields


class BuilderPageListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer (no nested schema)."""

    has_draft = serializers.SerializerMethodField()
    version_count = serializers.SerializerMethodField()

    class Meta:
        model = BuilderPage
        fields = [
            "id",
            "slug",
            "title",
            "locale",
            "direction",
            "status",
            "published_at",
            "has_draft",
            "version_count",
            "created_at",
            "updated_at",
        ]

    def get_has_draft(self, obj) -> bool:
        return hasattr(obj, "draft")

    def get_version_count(self, obj) -> int:
        return obj.versions.count()


class BuilderPageDetailSerializer(serializers.ModelSerializer):
    """Full serializer including draft schema."""

    draft = BuilderPageDraftSerializer(read_only=True)

    class Meta:
        model = BuilderPage
        fields = [
            "id",
            "slug",
            "title",
            "locale",
            "direction",
            "status",
            "published_at",
            "draft",
            "version",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BuilderPageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new builder page."""

    schema = serializers.JSONField(required=False, default=dict)

    class Meta:
        model = BuilderPage
        fields = [
            "slug",
            "title",
            "locale",
            "direction",
            "schema",
        ]

    def create(self, validated_data):
        schema = validated_data.pop("schema", {})
        actor = self.context["request"].user.get_username()
        page = BuilderPage.objects.create(
            **validated_data,
            created_by=actor,
            updated_by=actor,
        )
        BuilderPageDraft.objects.create(page=page, schema=schema)
        return page


class DraftPatchSerializer(serializers.Serializer):
    """Serializer for PATCH /draft with optimistic concurrency."""

    base_revision = serializers.IntegerField()
    schema = serializers.JSONField()
    client_mutation_id = serializers.CharField(
        required=False, default="", max_length=255
    )
