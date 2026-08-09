"""Translation status computation module.

Implements per-locale translation freshness detection for bilingual content
entities (Page, Article, CaseStudy).

Requirements:
- 8.8: Compute translation status per locale: Missing, Incomplete, Complete, Outdated
- 8.9: When source locale content changes, mark the other locale as Outdated

Status definitions:
- "missing": All target locale fields are empty (no translation exists)
- "incomplete": Some target locale fields are filled, others are empty
- "complete": All target locale fields are filled and up-to-date
- "outdated": All target locale fields are filled, but source locale was
  updated more recently than target locale
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from django.utils.dateparse import parse_datetime


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SUPPORTED_LOCALES: tuple[str, ...] = ("fa", "en")

# Maps model app_label.model to the locale-specific field base names
# that are considered "translatable content" for status computation.
# Note: slug fields are excluded because they are routing/technical fields
# that often have placeholder values even when no translation exists.
_LOCALE_FIELDS_MAP: dict[str, list[str]] = {
    "cms.page": ["title"],
    "blog.article": ["title", "excerpt"],
    "portfolio.casestudy": ["title", "role", "outcome", "statement", "problem"],
}


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def _get_model_label(entity: Any) -> str:
    """Return the 'app_label.model' identifier for an entity."""
    meta = entity._meta  # noqa: SLF001
    return f"{meta.app_label}.{meta.model_name}"


def _get_locale_fields(entity: Any, locale: str) -> dict[str, Any]:
    """Get all locale-specific field names and values for a given locale.

    Returns a dict of {field_name: field_value} for the target locale.
    For example, for an Article with locale="fa", returns:
    {"title_fa": "...", "slug_fa": "...", "excerpt_fa": "..."}

    If the entity's model is not in the known map, falls back to
    auto-discovery of fields ending with _{locale}.
    """
    model_label = _get_model_label(entity)
    known_bases = _LOCALE_FIELDS_MAP.get(model_label)

    if known_bases is not None:
        fields = {}
        for base in known_bases:
            field_name = f"{base}_{locale}"
            fields[field_name] = getattr(entity, field_name, "")
        return fields

    # Fallback: auto-discover fields ending with _{locale}
    suffix = f"_{locale}"
    fields = {}
    for field in entity._meta.get_fields():  # noqa: SLF001
        if hasattr(field, "attname") and field.attname.endswith(suffix):
            fields[field.attname] = getattr(entity, field.attname, "")
    return fields


def _is_field_empty(value: Any) -> bool:
    """Determine if a field value is considered empty for translation purposes."""
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ""
    return False


def get_locale_last_edit(entity: Any, locale: str) -> datetime | None:
    """Get the last edit timestamp for a specific locale.

    Reads from entity.locale_updated_at JSON field which stores per-locale
    timestamps as ISO 8601 strings.

    Args:
        entity: A model instance with a locale_updated_at JSONField.
        locale: The locale to check ("fa" or "en").

    Returns:
        A datetime if a timestamp is recorded, None otherwise.
    """
    locale_timestamps = getattr(entity, "locale_updated_at", None)
    if not locale_timestamps or not isinstance(locale_timestamps, dict):
        return None

    timestamp_str = locale_timestamps.get(locale)
    if not timestamp_str:
        return None

    # Handle already-parsed datetime objects
    if isinstance(timestamp_str, datetime):
        return timestamp_str

    # Parse ISO 8601 string
    return parse_datetime(str(timestamp_str))


# ---------------------------------------------------------------------------
# Main computation functions
# ---------------------------------------------------------------------------


def compute_translation_status(entity: Any, target_locale: str) -> str:
    """Compute the translation freshness status for a given locale.

    Algorithm:
    1. Get all locale-specific fields for the target locale
    2. If ALL target locale fields are empty → "missing"
    3. If SOME target locale fields are empty → "incomplete"
    4. Check if source locale was updated after target locale → "outdated"
    5. Otherwise → "complete"

    Args:
        entity: A model instance with locale-specific fields
            (Page, Article, CaseStudy).
        target_locale: The locale to check status for ("fa" or "en").

    Returns:
        One of: "missing", "incomplete", "complete", "outdated"

    Raises:
        ValueError: If target_locale is not a supported locale.
    """
    if target_locale not in SUPPORTED_LOCALES:
        raise ValueError(
            f"Unsupported locale '{target_locale}'. "
            f"Supported: {SUPPORTED_LOCALES}"
        )

    # Determine the source locale (opposite of target)
    source_locale = "en" if target_locale == "fa" else "fa"

    # Step 1: Get target locale field values
    target_fields = _get_locale_fields(entity, target_locale)

    if not target_fields:
        # No translatable fields found for this entity type
        return "complete"

    # Step 2: Check if ALL target fields are empty → "missing"
    field_values = list(target_fields.values())
    all_empty = all(_is_field_empty(v) for v in field_values)
    if all_empty:
        return "missing"

    # Step 3: Check if SOME target fields are empty → "incomplete"
    some_empty = any(_is_field_empty(v) for v in field_values)
    if some_empty:
        return "incomplete"

    # Step 4: Check if source locale was updated after target locale → "outdated"
    source_last_edit = get_locale_last_edit(entity, source_locale)
    target_last_edit = get_locale_last_edit(entity, target_locale)

    if source_last_edit and target_last_edit and source_last_edit > target_last_edit:
        return "outdated"

    # Step 5: All fields filled and not outdated → "complete"
    return "complete"


def get_translation_status_for_entity(entity: Any) -> dict[str, str]:
    """Compute translation status for all supported locales.

    Returns status for both 'fa' and 'en' locales as a dictionary.

    Args:
        entity: A model instance with locale-specific fields.

    Returns:
        Dict mapping locale to status, e.g.:
        {"fa": "complete", "en": "incomplete"}
    """
    return {
        locale: compute_translation_status(entity, locale)
        for locale in SUPPORTED_LOCALES
    }
