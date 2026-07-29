"""Workflow models.

Provides ``AuditEvent`` for recording state transitions, ``Revision`` for
immutable content snapshots, ``ScheduledPublish`` for deferred publication,
and ``PreviewToken`` for short-lived locale-specific preview access.

Supports Requirements 8.4, 8.5, 8.6, 8.7, 8.10.
"""

from __future__ import annotations

import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models import TimestampedModel


class AuditEvent(models.Model):
    """Records a single workflow state transition.

    Captures who performed the transition, when, from/to statuses, and an
    optional reason. Uses GenericForeignKey to reference any entity that
    participates in the workflow state machine (Page, Article, CaseStudy).

    Requirement 8.10: Record an audit event for every state transition with
    user, timestamp, and reason.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Generic relation to the transitioned entity
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="audit_events",
    )
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Transition details
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)

    # Actor and timing
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    # Optional explanation
    reason = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["timestamp"]),
            models.Index(fields=["user"]),
        ]
        verbose_name = "Audit Event"
        verbose_name_plural = "Audit Events"

    def __str__(self) -> str:
        return (
            f"AuditEvent({self.from_status} → {self.to_status}, "
            f"user={self.user_id}, {self.timestamp})"
        )


class Revision(TimestampedModel):
    """Immutable snapshot of an entity at a point in time.

    Requirement 8.4: Create immutable revision snapshots on publish and on demand.
    """

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    snapshot = models.JSONField()
    label = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Revision"
        verbose_name_plural = "Revisions"

    def __str__(self) -> str:
        return f"Revision({self.label or self.pk})"


class ScheduledPublish(models.Model):
    """Represents a deferred publication job.

    Requirement 8.6: Timezone-aware scheduling with idempotent jobs,
    retry policy, and failure logging.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="scheduled_publishes",
    )
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    scheduled_at = models.DateTimeField()
    timezone = models.CharField(max_length=50, default="Asia/Tehran")
    status = models.CharField(max_length=20, default="pending")
    attempts = models.IntegerField(default=0)
    last_error = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["scheduled_at"]
        indexes = [
            models.Index(fields=["status", "scheduled_at"]),
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Scheduled Publish"
        verbose_name_plural = "Scheduled Publishes"

    def __str__(self) -> str:
        return f"ScheduledPublish({self.object_id}, at={self.scheduled_at})"


class PreviewToken(models.Model):
    """Short-lived, locale-specific, revocable preview token.

    Stores issued preview tokens in the database for durable revocation
    tracking and auditability. The token value itself is a cryptographically
    signed string (Django signing framework) that embeds the content reference
    and locale — validation does not require a database lookup. The database
    record enables:

    1. Durable revocation (survives process restarts)
    2. Bulk revocation by entity or locale
    3. Expiry-based cleanup via scheduled jobs

    Requirement 8.7: Short-lived preview tokens (15min) that are locale-
    specific, revocable, and not logged or cached.

    Note: Preview responses MUST include X-Robots-Tag: noindex and
    Cache-Control: no-store headers (enforced at the view layer).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # The signed token string (used as lookup key for revocation)
    token = models.TextField(unique=True)

    # Content reference (which entity this token grants preview access to)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="preview_tokens",
    )
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Locale binding — token only valid for this locale
    locale = models.CharField(max_length=2)  # "fa" or "en"

    # Lifecycle
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    revoked = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["expires_at"]),
            models.Index(fields=["revoked", "expires_at"]),
        ]
        verbose_name = "Preview Token"
        verbose_name_plural = "Preview Tokens"

    def __str__(self) -> str:
        status_label = "revoked" if self.revoked else "active"
        return (
            f"PreviewToken({self.locale}, {status_label}, "
            f"expires={self.expires_at})"
        )

    @property
    def is_expired(self) -> bool:
        """Check if the token has passed its expiry time."""
        from django.utils import timezone as tz

        return tz.now() >= self.expires_at

    @property
    def is_valid(self) -> bool:
        """Check if the token is still usable (not revoked, not expired)."""
        return not self.revoked and not self.is_expired
