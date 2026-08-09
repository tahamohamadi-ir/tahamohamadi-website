"""Portfolio serializers with nested narrative blocks.

Provides serializers for the case study system:
- ``CaseStudyBlockSerializer``: Block within a case study (same pattern as CMS).
- ``CaseStudySerializer``: Full admin CRUD with nested narrative blocks.
- ``CaseStudyListSerializer``: Lightweight for list views (no blocks).
- ``PublicCaseStudySerializer``: Read-only public detail with locale-filtered blocks.
- ``PublicCaseStudyListSerializer``: Read-only public list (metadata only).

Nested write support (mirrors CMS pattern):
- On create: create case study + narrative blocks in one transaction.
- On update: replace narrative blocks for given locale (delete existing, recreate).

Requirements: 7.2, 7.3, 1.4
"""

from __future__ import annotations

from django.db import transaction
from rest_framework import serializers

from apps.media.models import MediaAsset
from apps.media.serializers import MediaAssetSerializer
from apps.portfolio.models import CaseStudy, CaseStudyBlock


# ---------------------------------------------------------------------------
# CaseStudyBlock Serializer
# ---------------------------------------------------------------------------


class CaseStudyBlockSerializer(serializers.ModelSerializer):
    """Serializer for a narrative block within a case study.

    Fields: id, locale, block_type, content, ordering.
    Same block system as the CMS Composer.
    """

    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = CaseStudyBlock
        fields = ["id", "locale", "block_type", "content", "ordering"]


# ---------------------------------------------------------------------------
# CaseStudy Serializer (full admin CRUD)
# ---------------------------------------------------------------------------


class CaseStudySerializer(serializers.ModelSerializer):
    """Full serializer for admin CRUD operations on case studies.

    Features:
    - All model fields exposed.
    - Nested narrative_blocks (writable).
    - gallery as PrimaryKeyRelatedField (write: accepts list of UUIDs).
    - technologies as JSONField (list of strings).
    - version field for optimistic locking.

    Nested write behaviour:
    - On create: creates case study then narrative blocks in a transaction.
    - On update: replaces narrative blocks — deletes existing blocks for each
      locale present in the payload, then recreates from payload data.
    """

    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    created_by = serializers.CharField(read_only=True)
    updated_by = serializers.CharField(read_only=True)

    narrative_blocks = CaseStudyBlockSerializer(many=True, required=False)
    gallery = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=MediaAsset.objects.all(),
        required=False,
    )
    technologies = serializers.JSONField(required=False, default=list)

    class Meta:
        model = CaseStudy
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "role_fa",
            "role_en",
            "client_fa",
            "client_en",
            "date_start",
            "date_end",
            "technologies",
            "statement_fa",
            "statement_en",
            "problem_fa",
            "problem_en",
            "outcome_fa",
            "outcome_en",
            "gallery",
            "featured",
            "status",
            "published_at",
            "version",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "narrative_blocks",
        ]

    def validate_technologies(self, value: list) -> list:
        """Ensure technologies is a list of strings."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Technologies must be a list.")
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError(
                    "Each technology must be a string."
                )
        return value

    @transaction.atomic
    def create(self, validated_data: dict) -> CaseStudy:
        blocks_data = validated_data.pop("narrative_blocks", [])
        gallery_data = validated_data.pop("gallery", [])
        # version is not settable on create — model default (1) applies
        validated_data.pop("version", None)

        case_study = CaseStudy.objects.create(**validated_data)

        # Create narrative blocks
        for block_data in blocks_data:
            CaseStudyBlock.objects.create(case_study=case_study, **block_data)

        # Set gallery M2M
        if gallery_data:
            case_study.gallery.set(gallery_data)

        return case_study

    @transaction.atomic
    def update(self, instance: CaseStudy, validated_data: dict) -> CaseStudy:
        blocks_data = validated_data.pop("narrative_blocks", None)
        gallery_data = validated_data.pop("gallery", None)
        # version is consumed by the view/service for optimistic locking
        validated_data.pop("version", None)

        # Update scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace narrative blocks: delete existing for each locale in payload,
        # then recreate from payload data.
        if blocks_data is not None:
            locales_in_payload = {b["locale"] for b in blocks_data}
            for locale in locales_in_payload:
                instance.narrative_blocks.filter(locale=locale).delete()

            for block_data in blocks_data:
                CaseStudyBlock.objects.create(
                    case_study=instance, **block_data
                )

        # Update gallery M2M if provided
        if gallery_data is not None:
            instance.gallery.set(gallery_data)

        return instance



# ---------------------------------------------------------------------------
# CaseStudy List Serializer (lightweight, no blocks)
# ---------------------------------------------------------------------------


class CaseStudyListSerializer(serializers.ModelSerializer):
    """Lightweight case study serializer for admin list endpoints (no blocks)."""

    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = CaseStudy
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "role_fa",
            "role_en",
            "client_fa",
            "client_en",
            "date_start",
            "date_end",
            "technologies",
            "statement_fa",
            "statement_en",
            "problem_fa",
            "problem_en",
            "featured",
            "status",
            "published_at",
            "version",
            "created_at",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# Public Serializers (read-only, for anonymous access)
# ---------------------------------------------------------------------------


class PublicCaseStudySerializer(serializers.ModelSerializer):
    """Read-only serializer for public case study detail.

    Features:
    - Narrative blocks filtered by locale (from serializer context).
    - Gallery items serialized with full MediaAssetSerializer (read-only).
    - Excludes: version, created_by, updated_by (internal fields).
    """

    id = serializers.UUIDField(read_only=True)
    narrative_blocks = serializers.SerializerMethodField()
    gallery = MediaAssetSerializer(many=True, read_only=True)

    class Meta:
        model = CaseStudy
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "role_fa",
            "role_en",
            "client_fa",
            "client_en",
            "date_start",
            "date_end",
            "technologies",
            "statement_fa",
            "statement_en",
            "problem_fa",
            "problem_en",
            "outcome_fa",
            "outcome_en",
            "gallery",
            "featured",
            "status",
            "published_at",
            "narrative_blocks",
        ]
        read_only_fields = fields

    def get_narrative_blocks(self, case_study: CaseStudy) -> list[dict]:
        """Return narrative blocks filtered by locale from context."""
        locale = self.context.get("locale", "en")
        blocks = case_study.narrative_blocks.filter(locale=locale).order_by(
            "ordering"
        )
        return CaseStudyBlockSerializer(blocks, many=True).data


class PublicCaseStudyListSerializer(serializers.ModelSerializer):
    """Read-only lightweight serializer for public case study list.

    Metadata only — no narrative blocks. Used for portfolio grid/listing.
    Excludes: version, created_by, updated_by (internal fields).
    """

    id = serializers.UUIDField(read_only=True)
    gallery = MediaAssetSerializer(many=True, read_only=True)

    class Meta:
        model = CaseStudy
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "role_fa",
            "role_en",
            "client_fa",
            "client_en",
            "date_start",
            "date_end",
            "technologies",
            "statement_fa",
            "statement_en",
            "problem_fa",
            "problem_en",
            "outcome_fa",
            "outcome_en",
            "gallery",
            "featured",
            "status",
            "published_at",
        ]
        read_only_fields = fields
