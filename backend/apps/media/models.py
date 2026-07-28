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
