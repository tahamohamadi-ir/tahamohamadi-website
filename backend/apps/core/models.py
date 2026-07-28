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

    class Meta:
        abstract = True
