"""Block type registry with JSON Schema validation.

Provides a central registry of allowed block types and their settings schemas.
Each block_type maps to a JSON Schema dict that defines the expected shape of
the Block.settings JSONField.

Requirements:
- 4.4: Validate block settings against a registered schema per block_type
- 4.5: Reject unknown block_types (fail-closed)
- 4.6: Support minimum block types (hero, text, gallery, cta, collection,
       quote, divider, research_focus)
- 4.9: Exclude unknown block types from public responses (fail-closed)
"""

from __future__ import annotations

from jsonschema import Draft7Validator, ValidationError as JsonSchemaValidationError

# ---------------------------------------------------------------------------
# UUID format pattern (loose — accepts standard UUID hex with hyphens)
# ---------------------------------------------------------------------------
_UUID_PATTERN = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"

_COLLECTION_FILTERS_BY_SOURCE = {
    "portfolio": {"featured"},
    "skills": {"category"},
    "research_projects": {"featured"},
    "publications": {"publication_type"},
    "resumes": {"variant_type"},
}

# ---------------------------------------------------------------------------
# Block schemas: maps block_type name → JSON Schema (Draft 7)
# ---------------------------------------------------------------------------
BLOCK_SCHEMAS: dict[str, dict] = {
    "hero": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "subtitle": {"type": ["string", "null"]},
            "media_id": {
                "type": ["string", "null"],
                "pattern": _UUID_PATTERN,
            },
            "cta_url": {"type": ["string", "null"]},
        },
        "required": ["title"],
        "additionalProperties": False,
    },
    "text": {
        "type": "object",
        "properties": {
            "content": {"type": "string"},
            "alignment": {"type": "string", "enum": ["start", "center", "end"]},
        },
        "required": ["content", "alignment"],
        "additionalProperties": False,
    },
    "gallery": {
        "type": "object",
        "properties": {
            "media_ids": {
                "type": "array",
                "items": {"type": "string", "pattern": _UUID_PATTERN},
            },
            "layout": {"type": "string", "enum": ["grid", "carousel"]},
        },
        "required": ["media_ids", "layout"],
        "additionalProperties": False,
    },
    "cta": {
        "type": "object",
        "properties": {
            "label": {"type": "string"},
            "url": {"type": "string"},
            "variant": {"type": "string", "enum": ["primary", "secondary"]},
        },
        "required": ["label", "url", "variant"],
        "additionalProperties": False,
    },
    "collection": {
        "type": "object",
        "properties": {
            "source": {"type": "string", "enum": [
                "portfolio", "blog", "posts", "publications", "research_projects",
                "research_interests", "skills", "experience", "education", "certifications",
                "affiliations", "languages", "resumes",
            ]},
            "filter": {
                "type": "object",
                "properties": {
                    "featured": {"type": "boolean"},
                    "publication_type": {"type": "string", "enum": ["article", "book", "conference", "report", "manuscript"]},
                    "variant_type": {"type": "string", "enum": ["academic", "industry", "general"]},
                    "category": {"type": "string", "maxLength": 100},
                },
                "additionalProperties": False,
            },
            "limit": {"type": "integer", "minimum": 1, "maximum": 12},
            "order": {"type": "string", "enum": ["default", "newest", "oldest"]},
        },
        "required": ["source", "filter", "limit"],
        "additionalProperties": False,
    },
    "quote": {
        "type": "object",
        "properties": {
            "text": {"type": "string"},
            "attribution": {"type": ["string", "null"]},
        },
        "required": ["text"],
        "additionalProperties": False,
    },
    "divider": {
        "type": "object",
        "properties": {
            "style": {"type": "string", "enum": ["line", "space", "dots"]},
        },
        "required": ["style"],
        "additionalProperties": False,
    },
    "research_focus": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "description": {"type": "string"},
            "icon": {"type": ["string", "null"]},
        },
        "required": ["title", "description"],
        "additionalProperties": False,
    },
    # ---------------------------------------------------------------------------
    # Animation Block Schemas (UI Animations Page Builder)
    # ---------------------------------------------------------------------------
    "scroll_reveal": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "description": {"type": ["string", "null"]},
            "duration": {"type": "integer", "minimum": 50, "maximum": 3000},
            "delay": {"type": "integer", "minimum": 0, "maximum": 2000},
            "easing": {"type": "string", "enum": ["ease-in", "ease-out", "ease-in-out", "linear", "spring", "cubic-bezier"]},
            "trigger": {"type": "string", "enum": ["scroll", "load", "hover", "click"]},
            "direction": {"type": "string", "enum": ["up", "down", "left", "right"]},
        },
        "required": ["title", "duration", "delay", "easing", "trigger"],
        "additionalProperties": False,
    },
    "parallax": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "subtitle": {"type": ["string", "null"]},
            "media_url": {"type": ["string", "null"]},
            "speed": {"type": "number", "minimum": -2.0, "maximum": 2.0},
            "duration": {"type": "integer", "minimum": 50, "maximum": 3000},
            "delay": {"type": "integer", "minimum": 0, "maximum": 2000},
            "easing": {"type": "string", "enum": ["ease-in", "ease-out", "ease-in-out", "linear", "spring", "cubic-bezier"]},
            "trigger": {"type": "string", "enum": ["scroll", "load", "hover", "click"]},
        },
        "required": ["title", "duration", "delay", "easing", "trigger"],
        "additionalProperties": False,
    },
    "text_stagger": {
        "type": "object",
        "properties": {
            "content": {"type": "string", "maxLength": 500},
            "stagger_delay": {"type": "integer", "minimum": 10, "maximum": 500},
            "duration": {"type": "integer", "minimum": 50, "maximum": 3000},
            "delay": {"type": "integer", "minimum": 0, "maximum": 2000},
            "easing": {"type": "string", "enum": ["ease-in", "ease-out", "ease-in-out", "linear", "spring", "cubic-bezier"]},
            "trigger": {"type": "string", "enum": ["scroll", "load", "hover", "click"]},
        },
        "required": ["content", "duration", "delay", "easing", "trigger"],
        "additionalProperties": False,
    },
    "fade_in_sequence": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {"type": "string"},
            },
            "duration": {"type": "integer", "minimum": 50, "maximum": 3000},
            "delay": {"type": "integer", "minimum": 0, "maximum": 2000},
            "easing": {"type": "string", "enum": ["ease-in", "ease-out", "ease-in-out", "linear", "spring", "cubic-bezier"]},
            "trigger": {"type": "string", "enum": ["scroll", "load", "hover", "click"]},
        },
        "required": ["items", "duration", "delay", "easing", "trigger"],
        "additionalProperties": False,
    },
    "hover_card": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "description": {"type": "string", "maxLength": 500},
            "icon": {"type": ["string", "null"]},
            "hover_effect": {"type": "string", "enum": ["scale", "lift", "glow", "flip"]},
            "duration": {"type": "integer", "minimum": 50, "maximum": 3000},
            "delay": {"type": "integer", "minimum": 0, "maximum": 2000},
            "easing": {"type": "string", "enum": ["ease-in", "ease-out", "ease-in-out", "linear", "spring", "cubic-bezier"]},
            "trigger": {"type": "string", "enum": ["scroll", "load", "hover", "click"]},
        },
        "required": ["title", "description", "duration", "delay", "easing", "trigger"],
        "additionalProperties": False,
    },
    "counter_animation": {
        "type": "object",
        "properties": {
            "label": {"type": "string"},
            "target_number": {"type": "integer"},
            "suffix": {"type": ["string", "null"]},
            "duration": {"type": "integer", "minimum": 50, "maximum": 3000},
            "delay": {"type": "integer", "minimum": 0, "maximum": 2000},
            "easing": {"type": "string", "enum": ["ease-in", "ease-out", "ease-in-out", "linear", "spring", "cubic-bezier"]},
            "trigger": {"type": "string", "enum": ["scroll", "load", "hover", "click"]},
        },
        "required": ["label", "target_number", "duration", "delay", "easing", "trigger"],
        "additionalProperties": False,
    },
    "image_reveal": {
        "type": "object",
        "properties": {
            "media_url": {"type": "string"},
            "alt": {"type": ["string", "null"]},
            "reveal_direction": {"type": "string", "enum": ["left", "right", "top", "bottom", "center"]},
            "duration": {"type": "integer", "minimum": 50, "maximum": 3000},
            "delay": {"type": "integer", "minimum": 0, "maximum": 2000},
            "easing": {"type": "string", "enum": ["ease-in", "ease-out", "ease-in-out", "linear", "spring", "cubic-bezier"]},
            "trigger": {"type": "string", "enum": ["scroll", "load", "hover", "click"]},
        },
        "required": ["media_url", "duration", "delay", "easing", "trigger"],
        "additionalProperties": False,
    },
    "section_transition": {
        "type": "object",
        "properties": {
            "transition_type": {"type": "string", "enum": ["fade", "slide", "zoom", "clip"]},
            "duration": {"type": "integer", "minimum": 50, "maximum": 3000},
            "delay": {"type": "integer", "minimum": 0, "maximum": 2000},
            "easing": {"type": "string", "enum": ["ease-in", "ease-out", "ease-in-out", "linear", "spring", "cubic-bezier"]},
            "trigger": {"type": "string", "enum": ["scroll", "load", "hover", "click"]},
        },
        "required": ["transition_type", "duration", "delay", "easing", "trigger"],
        "additionalProperties": False,
    },
}

# Pre-compile validators for each schema (faster repeated validation)
_VALIDATORS: dict[str, Draft7Validator] = {
    block_type: Draft7Validator(schema)
    for block_type, schema in BLOCK_SCHEMAS.items()
}


def is_legacy_localized_settings(block_type: str, settings: dict) -> bool:
    """Recognize the two bilingual CMS settings shapes stored before v2.

    This is deliberately narrow: it keeps existing published content editable
    while the public serializer can project the requested locale without
    falling back to the other language.
    """
    if not isinstance(settings, dict):
        return False

    if block_type == "hero":
        allowed = {
            "heading_fa", "heading_en", "subheading_fa", "subheading_en",
            "cta_text_fa", "cta_text_en", "cta_link",
        }
        required = {"heading_fa", "heading_en"}
        return set(settings).issubset(allowed) and required.issubset(settings) and all(
            isinstance(settings[name], str) for name in required
        )

    if block_type == "text":
        return set(settings) == {"body_fa", "body_en"} and all(
            isinstance(settings[name], str) for name in ("body_fa", "body_en")
        )

    return False


def public_block_settings(block_type: str, settings: dict, locale: str) -> dict:
    """Return canonical renderer settings for the requested locale only."""
    if not is_legacy_localized_settings(block_type, settings):
        return settings.copy()

    if block_type == "hero":
        result = {
            "title": settings[f"heading_{locale}"],
            "cta_url": settings.get("cta_link"),
        }
        for legacy_name, canonical_name in (
            (f"subheading_{locale}", "subtitle"),
            (f"cta_text_{locale}", "cta_label"),
        ):
            value = settings.get(legacy_name)
            if value:
                result[canonical_name] = value
        return result

    return {"content": settings[f"body_{locale}"], "alignment": "start"}


def validate_block_settings(block_type: str, settings: dict) -> list[str]:
    """Validate block settings against the registered schema for block_type.

    Args:
        block_type: The block type identifier (e.g. "hero", "text").
        settings: The settings dict to validate.

    Returns:
        An empty list if the settings are valid.
        A list of human-readable error strings if validation fails.

    Raises:
        ValueError: If block_type is not registered (fail-closed per Req 4.5, 4.9).
    """
    if block_type not in _VALIDATORS:
        raise ValueError(
            f"Unknown block_type '{block_type}'. "
            f"Allowed types: {sorted(BLOCK_SCHEMAS.keys())}"
        )

    validator = _VALIDATORS[block_type]
    errors: list[str] = []

    for error in validator.iter_errors(settings):
        # Build a readable path like "settings.media_ids[0]"
        path = ".".join(str(p) for p in error.absolute_path) if error.absolute_path else "(root)"
        errors.append(f"{path}: {error.message}")

    if block_type == "collection" and isinstance(settings, dict):
        source = settings.get("source")
        requested_filter = settings.get("filter", {})
        if isinstance(requested_filter, dict):
            invalid_filters = set(requested_filter) - _COLLECTION_FILTERS_BY_SOURCE.get(source, set())
            if invalid_filters:
                errors.append(f"filter: unsupported for source '{source}': {sorted(invalid_filters)}")

    if errors and is_legacy_localized_settings(block_type, settings):
        return []

    return errors


def is_known_block_type(block_type: str) -> bool:
    """Check whether a block_type is registered in the registry."""
    return block_type in BLOCK_SCHEMAS
