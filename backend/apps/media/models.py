"""Media models.

Provides ``MediaAsset`` — the single model backing all uploaded files
(images, documents, etc.) for the site.

Features:
- Content-hash naming for deduplication (Requirement 5.2)
- Per-locale alt text and caption for fa/en (Requirement 5.4)
- Optional width/height for images (Requirement 5.3, extracted in task 3.3)
- Status field for soft archive (Requirement 5)
"""

from django.db import models

from apps.core.models import TimestampedModel


class MediaAsset(TimestampedModel):
    """A single uploaded media file with metadata and per-locale descriptions."""

    file = models.FileField(upload_to="media/%Y/%m/")
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    file_size = models.IntegerField()  # bytes
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    checksum = models.CharField(max_length=64)  # SHA-256
    alt_text_fa = models.TextField(blank=True, default="")
    alt_text_en = models.TextField(blank=True, default="")
    caption_fa = models.TextField(blank=True, default="")
    caption_en = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, default="active")  # active | archived

    class Meta:
        indexes = [
            models.Index(fields=["mime_type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["checksum"]),
        ]

    def __str__(self) -> str:
        return f"{self.original_filename} ({self.mime_type})"


class MediaUsageReference(models.Model):
    """Indexed, schema-aware reference from content to a media asset.

    JSON-backed blocks retain their typed payloads, while this table gives
    media operations a durable, queryable index. The concrete nullable foreign
    keys preserve referential integrity for every supported source kind.
    """

    SOURCE_TYPES = (
        ("cms_block", "CMS block"),
        ("article", "Article featured image"),
        ("article_block", "Article block"),
        ("case_study", "Case study gallery"),
        ("case_study_block", "Case study block"),
    )
    OWNER_TYPES = (
        ("page", "Page"),
        ("article", "Article"),
        ("case_study", "Case study"),
    )

    media = models.ForeignKey(
        MediaAsset,
        on_delete=models.CASCADE,
        related_name="usage_references",
    )
    source_type = models.CharField(max_length=32, choices=SOURCE_TYPES)
    source_id = models.UUIDField()
    owner_type = models.CharField(max_length=32, choices=OWNER_TYPES)
    owner_id = models.UUIDField()
    reference_field = models.CharField(max_length=64)
    cms_block = models.ForeignKey(
        "cms.Block",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="media_usage_references",
    )
    article = models.ForeignKey(
        "blog.Article",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="media_usage_references",
    )
    article_block = models.ForeignKey(
        "blog.ArticleBlock",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="media_usage_references",
    )
    case_study = models.ForeignKey(
        "portfolio.CaseStudy",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="media_usage_references",
    )
    case_study_block = models.ForeignKey(
        "portfolio.CaseStudyBlock",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="media_usage_references",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["media", "source_type", "source_id", "reference_field"],
                name="media_usage_reference_unique_source_field",
            )
        ]
        indexes = [
            models.Index(
                fields=["media", "owner_type", "owner_id"],
                name="media_media_media_i_5f8956_idx",
            ),
            models.Index(
                fields=["source_type", "source_id"],
                name="media_media_source__be1ba4_idx",
            ),
        ]
