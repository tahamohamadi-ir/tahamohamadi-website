"""Page Builder models.

Provides ``BuilderPage``, ``BuilderPageDraft``, and ``BuilderPageVersion`` —
the core entities for the Advanced Visual Page Builder.

Design decisions (from Blueprint):
- BuilderPageDraft: mutable working copy stored as JSONB schema
- BuilderPageVersion: immutable snapshot created on publish/checkpoint
- Hybrid Relational + JSONB: relational for lifecycle/query, JSONB for document content

ADR-002: Semantic JSON is Source of Truth
ADR-005: PostgreSQL relational + JSONB
ADR-019: Immutable published versions
"""

import hashlib
import json

from django.conf import settings
from django.db import models

from apps.core.models import VersionedModel


class BuilderPage(VersionedModel):
    """A page managed by the visual page builder.

    Separate from the legacy CMS ``Page`` model to allow parallel operation
    during migration.
    """

    slug = models.SlugField(unique=True, allow_unicode=True, max_length=255)
    title = models.CharField(max_length=255)
    locale = models.CharField(max_length=10, default="fa-IR")
    direction = models.CharField(max_length=3, default="rtl")

    status = models.CharField(
        max_length=32,
        default="draft",
        db_index=True,
        choices=[
            ("draft", "Draft"),
            ("review", "In Review"),
            ("approved", "Approved"),
            ("scheduled", "Scheduled"),
            ("published", "Published"),
            ("archived", "Archived"),
        ],
    )

    current_published_version = models.ForeignKey(
        "BuilderPageVersion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at", "id"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
            models.Index(fields=["published_at"]),
        ]

    def __str__(self) -> str:
        return f"BuilderPage({self.slug})"


class BuilderPageDraft(models.Model):
    """Mutable working copy of a page's document schema.

    The ``schema`` JSONField contains the full normalized page document
    (nodes, styles, bindings, etc.) — the Source of Truth for page content.

    ``revision`` is used for optimistic concurrency control during autosave.
    """

    page = models.OneToOneField(
        BuilderPage,
        on_delete=models.CASCADE,
        related_name="draft",
    )

    schema = models.JSONField(
        default=dict,
        help_text="Full page document schema (JSONB). Source of Truth.",
    )

    revision = models.PositiveBigIntegerField(
        default=0,
        help_text="Monotonically increasing revision for optimistic concurrency.",
    )

    schema_version = models.CharField(
        max_length=32,
        default="1.0.0",
        help_text="Schema format version for migrations.",
    )

    content_hash = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="SHA-256 hash of the schema for deduplication.",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["revision"]),
        ]

    def __str__(self) -> str:
        return f"BuilderPageDraft(page={self.page_id}, rev={self.revision})"

    def compute_content_hash(self) -> str:
        """Compute SHA-256 hash of the schema."""
        serialized = json.dumps(self.schema, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def save(self, *args, **kwargs):
        self.content_hash = self.compute_content_hash()
        super().save(*args, **kwargs)


class BuilderPageVersion(models.Model):
    """Immutable snapshot of a page document.

    Created on manual checkpoint, review submission, publish,
    scheduled publish, or restore operations.

    Once created, the schema MUST NOT be modified (ADR-019).
    """

    page = models.ForeignKey(
        BuilderPage,
        on_delete=models.CASCADE,
        related_name="versions",
    )

    version_number = models.PositiveIntegerField()

    schema = models.JSONField(
        help_text="Immutable snapshot of the page document schema.",
    )

    schema_version = models.CharField(
        max_length=32,
        default="1.0.0",
    )

    content_hash = models.CharField(
        max_length=64,
        blank=True,
        default="",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    reason = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Why this version was created (e.g., 'publish', 'checkpoint').",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-version_number"]
        unique_together = [("page", "version_number")]
        indexes = [
            models.Index(fields=["page", "version_number"]),
        ]

    def __str__(self) -> str:
        return f"BuilderPageVersion(page={self.page_id}, v{self.version_number})"
