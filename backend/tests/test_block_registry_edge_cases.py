"""Additional edge-case tests for block registry (task 2.8 supplement).

Covers:
- Deeply nested schema error handling
- Registry immutability / consistency (no duplicates)
- Edge cases in validate_block_settings
"""

import pytest

from apps.cms.block_registry import (
    BLOCK_SCHEMAS,
    _VALIDATORS,
    is_known_block_type,
    validate_block_settings,
)


# ---------------------------------------------------------------------------
# Registry consistency and immutability
# ---------------------------------------------------------------------------


class TestBlockRegistryConsistency:
    """Verify the block registry is consistent and correctly structured."""

    def test_no_duplicate_keys_in_schemas(self):
        """BLOCK_SCHEMAS keys and _VALIDATORS keys must be identical."""
        assert set(BLOCK_SCHEMAS.keys()) == set(_VALIDATORS.keys())

    def test_every_schema_has_precompiled_validator(self):
        """Each registered block_type has a corresponding pre-compiled validator."""
        for block_type in BLOCK_SCHEMAS:
            assert block_type in _VALIDATORS, f"Missing validator for {block_type}"

    def test_all_schemas_are_json_schema_objects(self):
        """Every schema in the registry has type=object at the root."""
        for block_type, schema in BLOCK_SCHEMAS.items():
            assert schema.get("type") == "object", (
                f"Schema for '{block_type}' should be of type 'object'"
            )

    def test_all_schemas_have_required_field(self):
        """Every schema declares its required properties."""
        for block_type, schema in BLOCK_SCHEMAS.items():
            assert "required" in schema, f"Schema for '{block_type}' missing 'required'"

    def test_all_schemas_disallow_additional_properties(self):
        """All schemas set additionalProperties to False for strictness."""
        for block_type, schema in BLOCK_SCHEMAS.items():
            assert schema.get("additionalProperties") is False, (
                f"Schema for '{block_type}' should disallow additional properties"
            )


# ---------------------------------------------------------------------------
# Deeply nested schema validation errors
# ---------------------------------------------------------------------------


class TestDeeplyNestedSchemaErrors:
    """Test that validate_block_settings handles nested structure errors."""

    def test_gallery_media_ids_with_multiple_invalid_uuids(self):
        """Multiple invalid UUIDs in a gallery produce per-item errors."""
        settings = {
            "media_ids": ["not-uuid-1", "not-uuid-2", "valid-looking-but-no"],
            "layout": "grid",
        }
        errors = validate_block_settings("gallery", settings)
        # Each invalid UUID generates an error
        assert len(errors) >= 3

    def test_collection_filter_accepts_nested_object(self):
        """Collection filter allows arbitrary nested objects."""
        settings = {
            "source": "blog",
            "filter": {"category": {"in": ["tech", "design"]}, "published": True},
            "limit": 5,
        }
        errors = validate_block_settings("collection", settings)
        assert errors == []

    def test_hero_settings_with_empty_string_title(self):
        """Hero with empty string title is valid (schema allows it — type:string)."""
        errors = validate_block_settings("hero", {"title": ""})
        assert errors == []

    def test_text_settings_with_extra_nested_data_rejected(self):
        """Text block rejects additional properties even in settings root."""
        errors = validate_block_settings(
            "text",
            {"content": "Hi", "alignment": "start", "metadata": {"author": "taha"}},
        )
        assert len(errors) == 1
        assert "metadata" in errors[0] or "additional" in errors[0].lower()


# ---------------------------------------------------------------------------
# Edge cases in validation function
# ---------------------------------------------------------------------------


class TestValidateBlockSettingsEdgeCases:
    """Edge cases for the validate_block_settings function."""

    def test_empty_settings_for_type_with_no_required(self):
        """A block_type where all fields are optional should accept empty settings.
        (no current schema is fully optional, but hero only requires title)."""
        # hero requires title, so empty dict should produce an error
        errors = validate_block_settings("hero", {})
        assert len(errors) == 1

    def test_none_value_for_nullable_field(self):
        """Fields typed as ['string', 'null'] accept None."""
        errors = validate_block_settings("hero", {"title": "Hi", "subtitle": None})
        assert errors == []

    def test_integer_zero_for_collection_limit_fails(self):
        """Collection limit=0 violates minimum: 1."""
        errors = validate_block_settings(
            "collection", {"source": "x", "filter": {}, "limit": 0}
        )
        assert len(errors) == 1

    def test_negative_limit_for_collection_fails(self):
        """Collection limit=-1 violates minimum: 1."""
        errors = validate_block_settings(
            "collection", {"source": "x", "filter": {}, "limit": -1}
        )
        assert len(errors) == 1

    def test_is_known_block_type_with_none(self):
        """is_known_block_type should handle None gracefully."""
        # Python dict `in` handles non-string values, returns False
        assert is_known_block_type(None) is False  # type: ignore

    def test_is_known_block_type_case_sensitive(self):
        """Block types are case-sensitive."""
        assert is_known_block_type("Hero") is False
        assert is_known_block_type("HERO") is False
        assert is_known_block_type("hero") is True

    def test_validate_settings_with_non_dict_raises_errors(self):
        """Passing a list instead of dict as settings should produce errors."""
        errors = validate_block_settings("hero", [])  # type: ignore
        # The validator checks against type:object, so a list fails
        assert len(errors) >= 1
