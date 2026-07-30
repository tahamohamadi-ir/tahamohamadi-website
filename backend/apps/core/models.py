"""Core abstract base models.

Provides ``TimestampedModel`` and ``VersionedModel`` — abstract bases used
by all concrete models in the project.

Features:
- UUID primary keys (Requirement 2.2)
- Audit fields: created_at, updated_at, created_by, updated_by (Requirement 2.2)
- Optimistic locking via integer version field (Requirement 2.3)
"""

import uuid

from django.db import models


class TimestampedModel(models.Model):
    """Abstract base with UUID PK and audit timestamps/actors.

    All concrete models should inherit from this (or from VersionedModel)
    to get consistent primary keys and audit fields across the project.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=255, blank=True, default="")
    updated_by = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        abstract = True


class VersionedModel(TimestampedModel):
    """Abstract base adding an integer version for optimistic locking.

    On every save the caller must verify the version matches the database
    value before committing — otherwise a 409 Conflict is returned.
    """

    version = models.IntegerField(default=1)
    locale_updated_at = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Per-locale last-edit timestamps. "
            'Example: {"fa": "2024-01-01T12:00:00Z", "en": "2024-01-02T14:30:00Z"}'
        ),
    )

    class Meta:
        abstract = True


class ContactMessage(TimestampedModel):
    """A public contact submission retained for the protected Admin inbox."""

    class Status(models.TextChoices):
        NEW = "new", "New"
        READ = "read", "Read"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=254)
    subject = models.CharField(max_length=200)
    message = models.TextField(max_length=5000)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["email"]),
        ]
