"""CMS serializers with nested write support.

Provides ``BlockSerializer``, ``SectionSerializer``, ``PageSerializer``,
and ``PageListSerializer`` — DRF serializers that act as DTOs for the
page composition system.

Nested write support:
- On create: create page → sections → blocks in one transaction.
- On update: replace all sections/blocks (delete existing, recreate from payload).
  This simplifies ordering changes and avoids complex diffing.

Business rules (validation, optimistic locking) live in services.py.
"""

from __future__ import annotations

from django.db import transaction
from rest_framework import serializers

from apps.cms.block_registry import (
    is_known_block_type,
    public_block_settings,
    validate_block_settings,
)
from apps.cms.collections import resolve_identity_collection
from apps.cms.models import Block, ComposerTemplate, Page, Section
from apps.cms.services import is_safe_public_block
from apps.media.models import MediaAsset


# ---------------------------------------------------------------------------
# Block Serializer
# ---------------------------------------------------------------------------


class BlockSerializer(serializers.ModelSerializer):
    """Serializer for a typed content block within a section.

    Validates:
    - block_type is registered in the block registry (fail-closed).
    - settings conform to the JSON Schema for the given block_type.
    """

    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Block
        fields = ["id", "block_type", "settings", "ordering"]

    def validate(self, attrs: dict) -> dict:
        block_type = attrs.get("block_type", "")
        settings = attrs.get("settings", {})

        # Reject unknown block types (fail-closed)
        if not is_known_block_type(block_type):
            raise serializers.ValidationError(
                {"block_type": f"Unknown block_type '{block_type}'."}
            )

        # Validate settings against the block_type schema
        errors = validate_block_settings(block_type, settings)
        if errors:
            raise serializers.ValidationError({"settings": errors})

        return attrs


# ---------------------------------------------------------------------------
# Section Serializer
# ---------------------------------------------------------------------------


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for an ordered section grouping blocks.

    Supports nested write: blocks are created/replaced alongside the section.
    """

    id = serializers.UUIDField(read_only=True)
    blocks = BlockSerializer(many=True)

    class Meta:
        model = Section
        fields = ["id", "ordering", "enabled", "layout", "blocks"]

    def create(self, validated_data: dict) -> Section:
        blocks_data = validated_data.pop("blocks", [])
        section = Section.objects.create(**validated_data)
        for block_data in blocks_data:
            Block.objects.create(section=section, **block_data)
        return section


# ---------------------------------------------------------------------------
# Page Serializer (full, with nested sections/blocks)
# ---------------------------------------------------------------------------


class PageSerializer(serializers.ModelSerializer):
    """Full page serializer with nested sections and blocks.

    Nested write support:
    - create: creates page, then sections, then blocks (all in one transaction).
    - update: replaces all sections/blocks (delete existing, create new from payload).

    Read-only fields: id, published_at, created_at, updated_at.
    Read-write fields: version (required on update for optimistic locking).

    The version field is intentionally read-write so that:
    - On read: the current version is returned to the client.
    - On update: the client sends the version it received, enabling the service
      layer to detect conflicts (409) before applying changes.
    - On create: version is optional (defaults to 1 via model default).
    """

    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(required=False)
    published_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    sections = SectionSerializer(many=True)

    class Meta:
        model = Page
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "page_type",
            "status",
            "version",
            "published_at",
            "created_at",
            "updated_at",
            "sections",
        ]

    @transaction.atomic
    def create(self, validated_data: dict) -> Page:
        sections_data = validated_data.pop("sections", [])
        # version is not settable on create — model default (1) applies
        validated_data.pop("version", None)
        page = Page.objects.create(**validated_data)

        for section_data in sections_data:
            blocks_data = section_data.pop("blocks", [])
            section = Section.objects.create(page=page, **section_data)
            for block_data in blocks_data:
                Block.objects.create(section=section, **block_data)

        return page

    @transaction.atomic
    def update(self, instance: Page, validated_data: dict) -> Page:
        sections_data = validated_data.pop("sections", [])
        # version is consumed by the view/service for optimistic locking —
        # don't apply it directly to the model (the lock service increments it).
        validated_data.pop("version", None)

        # Update page scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace all sections/blocks: delete existing, recreate from payload
        instance.sections.all().delete()

        for section_data in sections_data:
            blocks_data = section_data.pop("blocks", [])
            section = Section.objects.create(page=instance, **section_data)
            for block_data in blocks_data:
                Block.objects.create(section=section, **block_data)

        return instance


# ---------------------------------------------------------------------------
# Page List Serializer (lightweight, no nested sections/blocks)
# ---------------------------------------------------------------------------


class PageListSerializer(serializers.ModelSerializer):
    """Lightweight page serializer for list endpoints (no nested content)."""

    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Page
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "page_type",
            "status",
            "version",
            "published_at",
            "created_at",
            "updated_at",
        ]


class ComposerTemplateSerializer(serializers.ModelSerializer):
    """Admin projection for portable Draft templates with stable identifiers."""

    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(read_only=True)
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = ComposerTemplate
        fields = ["id", "name", "manifest", "status", "version", "created_at", "updated_at"]


class ComposerTemplateImportSerializer(serializers.Serializer):
    manifest = serializers.JSONField()
    dry_run = serializers.BooleanField()
    slug_fa = serializers.SlugField(max_length=50, allow_unicode=True)
    slug_en = serializers.SlugField(max_length=50)
    title_fa = serializers.CharField(max_length=255)
    title_en = serializers.CharField(max_length=255)
    page_type = serializers.CharField(max_length=50)


# ---------------------------------------------------------------------------
# Public Serializers (read-only, filtered projection for anonymous access)
# ---------------------------------------------------------------------------


class PublicBlockSerializer(serializers.ModelSerializer):
    """Public block serializer — excludes internal fields.

    Only blocks with known block_types are serialized (fail-closed filtering
    is applied in the view layer before passing queryset here).
    """

    id = serializers.UUIDField(read_only=True)
    settings = serializers.SerializerMethodField()

    class Meta:
        model = Block
        fields = ["id", "block_type", "settings", "ordering"]
        read_only_fields = fields

    def get_settings(self, block: Block) -> dict:
        locale = self.context.get("locale", "en")
        settings = public_block_settings(
            block.block_type,
            block.settings,
            locale,
        )
        settings = self._resolve_media(settings, locale)
        if block.block_type == "collection":
            settings["items"] = resolve_identity_collection(
                settings,
                self.context.get("locale", "en"),
                self.context.get("request"),
            )
        return settings

    def _resolve_media(self, settings: dict, locale: str) -> dict:
        media_ids: list[str] = []
        media_id = settings.get("media_id")
        if isinstance(media_id, str) and media_id:
            media_ids.append(media_id)
        configured_ids = settings.get("media_ids")
        if isinstance(configured_ids, list):
            media_ids.extend(value for value in configured_ids if isinstance(value, str))
        if not media_ids:
            return settings

        cache = self.context.setdefault("_cms_media_cache", {})
        missing = [value for value in media_ids if value not in cache]
        if missing:
            found = MediaAsset.objects.filter(id__in=missing, status="active")
            found_by_id = {str(asset.id): asset for asset in found}
            for value in missing:
                cache[value] = found_by_id.get(value)

        request = self.context.get("request")

        def asset_url(asset: MediaAsset) -> str | None:
            if not asset.file:
                return None
            url = asset.file.url
            return request.build_absolute_uri(url) if request else url

        if isinstance(media_id, str):
            asset = cache.get(media_id)
            url = asset_url(asset) if asset else None
            if url:
                settings["media_url"] = url
                settings["media_alt"] = getattr(asset, f"alt_text_{locale}", "")

        if isinstance(configured_ids, list):
            items = []
            for configured_id in configured_ids:
                asset = cache.get(configured_id)
                url = asset_url(asset) if asset else None
                if not asset or not url:
                    continue
                items.append({
                    "media_id": configured_id,
                    "url": url,
                    "alt": getattr(asset, f"alt_text_{locale}", ""),
                    "caption": getattr(asset, f"caption_{locale}", ""),
                })
            settings["items"] = items

        return settings


class PublicSectionSerializer(serializers.ModelSerializer):
    """Public section serializer — only enabled sections with valid blocks.

    Block filtering (exclude unknown block_types) is applied via a custom
    ``blocks`` field that uses a SerializerMethodField.
    """

    id = serializers.UUIDField(read_only=True)
    blocks = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ["id", "ordering", "layout", "blocks"]
        read_only_fields = fields

    def get_blocks(self, section: Section) -> list[dict]:
        """Return only blocks with known block_types, ordered by ordering."""
        valid_blocks = [
            block
            for block in section.blocks.all().order_by("ordering")
            if is_safe_public_block(block.block_type, block.settings)
        ]
        return PublicBlockSerializer(valid_blocks, many=True, context=self.context).data


class PublicPageSerializer(serializers.ModelSerializer):
    """Public page serializer — clean projection for anonymous access.

    Excludes: version, created_by, updated_by (internal fields).
    Includes: only enabled sections with valid blocks.
    Sections are ordered by their ``ordering`` field.
    """

    id = serializers.UUIDField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)
    sections = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "page_type",
            "published_at",
            "sections",
        ]
        read_only_fields = fields

    def get_sections(self, page: Page) -> list[dict]:
        """Return only enabled sections, ordered by ordering."""
        enabled_sections = page.sections.filter(enabled=True).order_by("ordering")
        return PublicSectionSerializer(
            enabled_sections,
            many=True,
            context=self.context,
        ).data
