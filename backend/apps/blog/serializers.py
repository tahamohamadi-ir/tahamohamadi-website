"""Blog serializers with locale-specific block content.

Provides:
- ``TopicSerializer``: ModelSerializer for topic tags.
- ``ArticleBlockSerializer``: ModelSerializer for article content blocks.
- ``ArticleSerializer``: Full serializer for create/update with nested blocks.
- ``ArticleListSerializer``: Lightweight for list (no blocks).
- ``PublicArticleSerializer``: Read-only for published articles with locale blocks.
- ``PublicArticleListSerializer``: Read-only for public list (no blocks).

Nested write support:
- On create: create article + blocks in one transaction.
- On update: replace blocks for the affected locale(s) (delete existing for
  those locales, recreate from payload).  This simplifies ordering changes
  and avoids complex diffing.

Business rules (validation, optimistic locking) live in services.py.
"""

from __future__ import annotations

from django.db import transaction
from rest_framework import serializers

from apps.blog.models import Article, ArticleBlock, Topic
from apps.media.models import MediaAsset
from apps.media.serializers import MediaAssetSerializer
from apps.blog.services import project_article_blocks


# ---------------------------------------------------------------------------
# Topic Serializer
# ---------------------------------------------------------------------------


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic (tag/category for articles)."""

    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Topic
        fields = ["id", "slug", "name_fa", "name_en"]


# ---------------------------------------------------------------------------
# ArticleBlock Serializer
# ---------------------------------------------------------------------------


class ArticleBlockSerializer(serializers.ModelSerializer):
    """Serializer for a typed content block within an Article.

    Each block belongs to a specific locale ("fa" or "en").
    """

    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = ArticleBlock
        fields = ["id", "locale", "block_type", "content", "ordering"]

    def validate_locale(self, value: str) -> str:
        if value not in ("fa", "en"):
            raise serializers.ValidationError(
                "locale must be 'fa' or 'en'."
            )
        return value


# ---------------------------------------------------------------------------
# Article Serializer (full, with nested blocks)
# ---------------------------------------------------------------------------


class ArticleSerializer(serializers.ModelSerializer):
    """Full article serializer with nested blocks.

    Nested write support:
    - create: creates article, then blocks (all in one transaction).
    - update: replaces blocks for the affected locale(s)
      (delete existing for those locales, recreate from payload).

    Read-only fields: id, published_at, created_at, updated_at.
    Read-write fields: version (required on update for optimistic locking).

    Topics:
    - Write: accepts list of topic UUIDs (PrimaryKeyRelatedField).
    - Read: returns full TopicSerializer representation via to_representation.
    """

    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(required=False)
    published_at = serializers.DateTimeField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    blocks = ArticleBlockSerializer(many=True)
    topics = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(),
        many=True,
        required=False,
    )
    featured_image = serializers.PrimaryKeyRelatedField(
        queryset=MediaAsset.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Article
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "excerpt_fa",
            "excerpt_en",
            "featured_image",
            "topics",
            "status",
            "version",
            "published_at",
            "reading_time_fa",
            "reading_time_en",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "blocks",
        ]

    def to_representation(self, instance: Article) -> dict:
        """Override read representation to serialize topics fully and
        featured_image with MediaAssetSerializer."""
        data = super().to_representation(instance)
        data["topics"] = TopicSerializer(instance.topics.all(), many=True).data
        if instance.featured_image:
            data["featured_image"] = MediaAssetSerializer(
                instance.featured_image, context=self.context
            ).data
        else:
            data["featured_image"] = None
        return data

    @transaction.atomic
    def create(self, validated_data: dict) -> Article:
        blocks_data = validated_data.pop("blocks", [])
        topics_data = validated_data.pop("topics", [])
        # version is not settable on create — model default (1) applies
        validated_data.pop("version", None)

        article = Article.objects.create(**validated_data)

        # Set M2M topics
        if topics_data:
            article.topics.set(topics_data)

        # Create blocks
        for block_data in blocks_data:
            ArticleBlock.objects.create(article=article, **block_data)

        return article

    @transaction.atomic
    def update(self, instance: Article, validated_data: dict) -> Article:
        blocks_data = validated_data.pop("blocks", [])
        topics_data = validated_data.pop("topics", None)
        # version is consumed by the view/service for optimistic locking —
        # don't apply it directly to the model (the lock service increments it).
        validated_data.pop("version", None)

        # Update article scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update M2M topics if provided
        if topics_data is not None:
            instance.topics.set(topics_data)

        # Replace blocks for the affected locale(s):
        # Determine which locales are present in the incoming payload
        affected_locales = {b["locale"] for b in blocks_data}
        if affected_locales:
            instance.blocks.filter(locale__in=affected_locales).delete()

        for block_data in blocks_data:
            ArticleBlock.objects.create(article=instance, **block_data)

        return instance


# ---------------------------------------------------------------------------
# Article List Serializer (lightweight, no blocks)
# ---------------------------------------------------------------------------


class ArticleListSerializer(serializers.ModelSerializer):
    """Lightweight article serializer for list endpoints (no blocks)."""

    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    topics = TopicSerializer(many=True, read_only=True)
    featured_image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = Article
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "excerpt_fa",
            "excerpt_en",
            "featured_image",
            "topics",
            "status",
            "version",
            "published_at",
            "reading_time_fa",
            "reading_time_en",
            "created_at",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# Public Article Serializer (read-only, for published articles)
# ---------------------------------------------------------------------------


class PublicArticleSerializer(serializers.ModelSerializer):
    """Public article serializer — clean projection for anonymous access.

    Excludes: version, created_by, updated_by (internal fields).
    Includes: blocks filtered by locale (passed via serializer context).
    Includes: reading_time for the requested locale.

    Usage:
        serializer = PublicArticleSerializer(article, context={"locale": "fa"})
    """

    id = serializers.UUIDField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    topics = TopicSerializer(many=True, read_only=True)
    featured_image = MediaAssetSerializer(read_only=True)
    blocks = serializers.SerializerMethodField()
    reading_time = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "excerpt_fa",
            "excerpt_en",
            "featured_image",
            "topics",
            "status",
            "published_at",
            "updated_at",
            "reading_time",
            "blocks",
        ]
        read_only_fields = fields

    def get_blocks(self, article: Article) -> list[dict]:
        """Return validated locale blocks with active media resolved."""
        locale = self.context.get("locale", "en")
        blocks = list(
            article.blocks.filter(locale=locale)
            .order_by("ordering")
            .values("id", "locale", "block_type", "content", "ordering")
        )
        referenced_ids = {
            media_id
            for block in blocks
            for media_id in _article_block_media_ids(block["content"])
        }
        media_assets = {
            str(asset.id): asset
            for asset in MediaAsset.objects.filter(
                id__in=referenced_ids, status="active"
            )
        }
        return project_article_blocks(blocks, media_assets, locale)

    def get_reading_time(self, article: Article) -> int:
        """Return reading_time for the requested locale."""
        locale = self.context.get("locale", "en")
        if locale == "fa":
            return article.reading_time_fa
        return article.reading_time_en


# ---------------------------------------------------------------------------
# Public Article List Serializer (no blocks, just metadata)
# ---------------------------------------------------------------------------


class PublicArticleListSerializer(serializers.ModelSerializer):
    """Public article list serializer — metadata only, no blocks.

    Excludes: version, created_by, updated_by, blocks.
    Includes: reading_time for the requested locale.
    """

    id = serializers.UUIDField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    topics = TopicSerializer(many=True, read_only=True)
    featured_image = MediaAssetSerializer(read_only=True)
    reading_time = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id",
            "slug_fa",
            "slug_en",
            "title_fa",
            "title_en",
            "excerpt_fa",
            "excerpt_en",
            "featured_image",
            "topics",
            "status",
            "published_at",
            "updated_at",
            "reading_time",
        ]
        read_only_fields = fields

    def get_reading_time(self, article: Article) -> int:
        """Return reading_time for the requested locale."""
        locale = self.context.get("locale", "en")
        if locale == "fa":
            return article.reading_time_fa
        return article.reading_time_en


def _article_block_media_ids(content: object) -> list[str]:
    if not isinstance(content, dict):
        return []
    media_ids: list[str] = []
    media_id = content.get("media_id")
    if isinstance(media_id, str):
        media_ids.append(media_id)
    configured = content.get("media_ids")
    if isinstance(configured, list):
        media_ids.extend(value for value in configured if isinstance(value, str))
    return media_ids
