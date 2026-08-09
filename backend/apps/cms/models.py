"""CMS models for page composition.

Provides ``Page``, ``Section``, and ``Block`` — the core content entities that
drive the bilingual page-builder CMS.

- Page inherits from VersionedModel (UUID PK, audit fields, optimistic locking).
- Section and Block are lightweight composition entities with explicit UUID PKs.
"""

import uuid

from django.db import models

from apps.core.models import VersionedModel


class Page(VersionedModel):
    """A publishable bilingual page with slug-per-locale routing."""

    slug_fa = models.SlugField(unique=True, allow_unicode=True)
    slug_en = models.SlugField(unique=True)
    title_fa = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)
    page_type = models.CharField(max_length=50)  # "home" | "custom"
    template_variant = models.CharField(max_length=50, default="default")
    status = models.CharField(max_length=20, default="draft")
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["slug_fa"]),
            models.Index(fields=["slug_en"]),
            models.Index(fields=["status"]),
            models.Index(fields=["published_at"]),
        ]

    def __str__(self) -> str:
        return f"Page({self.slug_en})"


class ComposerTemplate(VersionedModel):
    """A portable, validated snapshot that can only create a new Draft Page."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"

    name = models.CharField(max_length=255)
    manifest = models.JSONField(default=dict)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    class Meta:
        ordering = ["name", "id"]
        indexes = [models.Index(fields=["status", "name"])]

    def __str__(self) -> str:
        return f"ComposerTemplate({self.name})"


class Section(models.Model):
    """An ordered section within a Page, grouping Blocks together."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="sections")
    ordering = models.IntegerField()
    enabled = models.BooleanField(default=True)
    layout = models.CharField(max_length=50, default="default")

    class Meta:
        ordering = ["ordering"]

    def __str__(self) -> str:
        return f"Section(page={self.page_id}, order={self.ordering})"


class Block(models.Model):
    """A typed content block within a Section."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, related_name="blocks"
    )
    block_type = models.CharField(max_length=50)
    settings = models.JSONField(default=dict)  # typed per block_type
    ordering = models.IntegerField()

    class Meta:
        ordering = ["ordering"]

    def __str__(self) -> str:
        return f"Block(type={self.block_type}, order={self.ordering})"
