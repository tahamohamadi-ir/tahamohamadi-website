"""Core service layer.

Generic services shared across all apps. Contains the optimistic locking
algorithm used by any VersionedModel instance.
"""

from __future__ import annotations

from django.db import transaction


class ConflictError(Exception):
    """Raised when optimistic locking detects a version mismatch."""

    def __init__(self, current_version: int):
        self.current_version = current_version
        super().__init__(f"Version conflict: current version is {current_version}")


def save_with_optimistic_lock(instance, incoming_version: int, data: dict) -> object:
    """Save entity with optimistic locking.

    Uses SELECT FOR UPDATE + version check in a transaction.
    If version matches: applies data, increments version, saves.
    If version doesn't match: raises ConflictError with current version.

    Args:
        instance: A VersionedModel instance (must have a pk)
        incoming_version: The version the client received (sent back on save)
        data: Dict of field->value to apply to the instance

    Returns:
        The updated instance with incremented version

    Raises:
        ConflictError: If instance.version != incoming_version
    """
    with transaction.atomic():
        # Lock the row for update
        current = type(instance).objects.select_for_update().get(pk=instance.pk)

        if current.version != incoming_version:
            raise ConflictError(current_version=current.version)

        for key, value in data.items():
            setattr(current, key, value)

        current.version += 1
        current.save()

        return current
