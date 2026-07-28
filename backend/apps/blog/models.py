"""Blog models.

Provides ``Topic``, ``Article``, and ``ArticleBlock`` — the core entities for
the bilingual blog system.

Features:
- Per-locale slugs, titles, and excerpts for fa/en (Requirement 6.1)
- Topic tagging with M2M relationship (Requirement 6.2)
- Block-based content via ArticleBlock with JSONField (Requirement 6.3)
- Optimistic locking via VersionedModel on Article (Requirement 2.3)

Block types (Req 6.3):
  paragraph, heading, list, image, gallery, caption, quote, code,
  divider, callout, reference
"""

import uuid

from django.db import models

from apps.core.models import VersionedModel


class Topic(models.Model):
    """A tag/category for organizing articles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True, allow_unicode=True)
    name_fa = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255)

    class Meta:
        ordering = ["slug"]

    def __str__(self) -> str:
        return self.name_en


class Article(VersionedModel):
    """A publishable bilingual article with block-based content."""

    slug_fa = models.SlugField(unique=True, allow_unicode=True)
    slug_en = models.SlugField(unique=True)
    title_fa = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)
    excerpt_fa = models.TextField(blank=True, default="")
    excerpt_en = models.TextField(blank=True, default="")
    featured_image = models.ForeignKey(
        "media.MediaAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
    )
    topics = models.ManyToManyField(Topic, blank=True, related_name="articles")
    status = models.CharField(max_length=20, default="draft")
    published_at = models.DateTimeField(null=True, blank=True)
    reading_time_fa = models.IntegerField(default=0)  # minutes
    reading_time_en = models.IntegerField(default=0)  # minutes

    class Meta:
        indexes = [
            models.Index(fields=["slug_fa"]),
            models.Index(fields=["slug_en"]),
            models.Index(fields=["status"]),
            models.Index(fields=["published_at"]),
        ]

    def __str__(self) -> str:
        return f"Article({self.slug_en})"


class ArticleBlock(models.Model):
    """A typed content block within an Article for a specific locale."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="blocks"
    )
    locale = models.CharField(max_length=2)  # "fa" or "en"
    block_type = models.CharField(max_length=50)
    content = models.JSONField(default=dict)
    ordering = models.IntegerField()

    class Meta:
        ordering = ["ordering"]
        unique_together = [("article", "locale", "ordering")]

    def __str__(self) -> str:
        return f"ArticleBlock(type={self.block_type}, locale={self.locale}, order={self.ordering})"
