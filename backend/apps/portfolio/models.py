"""Portfolio models.

Provides ``CaseStudy`` and ``CaseStudyBlock`` — the models backing the
portfolio/case-study section of the site.

Features:
- Per-locale slugs, titles, role, client, outcome (Requirement 7.1)
- Narrative blocks with block_type and JSON content (Requirement 7.2)
- Technologies as JSON list, date range, gallery M2M to MediaAsset
- Featured flag and status/published_at for visibility control
- Optimistic locking via VersionedModel (Requirement 2.3)
"""

import uuid

from django.db import models

from apps.core.models import VersionedModel


class CaseStudy(VersionedModel):
    """A portfolio case study with per-locale content and metadata."""

    # --- Locale-specific slugs & titles ---
    slug_fa = models.SlugField(max_length=255, unique=True, allow_unicode=True)
    slug_en = models.SlugField(max_length=255, unique=True)
    title_fa = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)

    # --- Role & client ---
    role_fa = models.CharField(max_length=255, blank=True, default="")
    role_en = models.CharField(max_length=255, blank=True, default="")
    client_fa = models.CharField(max_length=255, blank=True, default="")
    client_en = models.CharField(max_length=255, blank=True, default="")

    # --- Date range ---
    date_start = models.DateField(null=True, blank=True)
    date_end = models.DateField(null=True, blank=True)

    # --- Technologies ---
    technologies = models.JSONField(default=list)

    # --- Statement & Problem ---
    statement_fa = models.TextField(blank=True, default="")
    statement_en = models.TextField(blank=True, default="")
    problem_fa = models.TextField(blank=True, default="")
    problem_en = models.TextField(blank=True, default="")

    # --- Outcome ---
    outcome_fa = models.TextField(blank=True, default="")
    outcome_en = models.TextField(blank=True, default="")

    # --- Gallery ---
    gallery = models.ManyToManyField(
        "media.MediaAsset",
        blank=True,
        related_name="portfolio_gallery",
    )

    # --- Visibility ---
    featured = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default="draft")
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "case studies"
        indexes = [
            models.Index(fields=["slug_fa"]),
            models.Index(fields=["slug_en"]),
            models.Index(fields=["status"]),
            models.Index(fields=["published_at"]),
            models.Index(fields=["featured"]),
        ]

    def __str__(self) -> str:
        return self.title_en or self.title_fa


class CaseStudyBlock(models.Model):
    """A narrative block belonging to a CaseStudy, supporting the block-based
    content system (same pattern as the CMS Composer)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_study = models.ForeignKey(
        CaseStudy,
        on_delete=models.CASCADE,
        related_name="narrative_blocks",
    )
    locale = models.CharField(max_length=2)  # "fa" or "en"
    block_type = models.CharField(max_length=50)
    content = models.JSONField(default=dict)
    ordering = models.IntegerField()

    class Meta:
        ordering = ["ordering"]
        unique_together = [("case_study", "locale", "ordering")]

    def __str__(self) -> str:
        return f"{self.case_study} [{self.locale}] block #{self.ordering}"
