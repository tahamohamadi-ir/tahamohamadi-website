"""Tests for the CMS block type registry and validation (task 2.2).

These tests do not require a database — they validate the in-memory schema
registry and the validate_block_settings function.
"""

import pytest

from apps.cms.block_registry import (
    BLOCK_SCHEMAS,
    is_known_block_type,
    public_block_settings,
    validate_block_settings,
)
from apps.cms.services import get_allowed_block_types


# ---------------------------------------------------------------------------
# Registry completeness
# ---------------------------------------------------------------------------


class TestBlockRegistry:
    """Tests for the registry itself."""

    REQUIRED_TYPES = [
        "hero",
        "text",
        "gallery",
        "cta",
        "collection",
        "quote",
        "divider",
        "research_focus",
    ]

    def test_registry_contains_all_required_types(self):
        for block_type in self.REQUIRED_TYPES:
            assert block_type in BLOCK_SCHEMAS, f"Missing required type: {block_type}"

    def test_get_allowed_block_types_returns_sorted_list(self):
        allowed = get_allowed_block_types()
        assert allowed == sorted(allowed)
        assert len(allowed) == len(BLOCK_SCHEMAS)

    def test_is_known_block_type_returns_true_for_registered(self):
        assert is_known_block_type("hero") is True
        assert is_known_block_type("text") is True

    def test_is_known_block_type_returns_false_for_unknown(self):
        assert is_known_block_type("unknown") is False
        assert is_known_block_type("") is False


# ---------------------------------------------------------------------------
# Unknown block_type (fail-closed: Req 4.5, 4.9)
# ---------------------------------------------------------------------------


class TestUnknownBlockType:
    """Validate that unknown block_types are rejected."""

    def test_unknown_type_raises_value_error(self):
        with pytest.raises(ValueError, match="Unknown block_type"):
            validate_block_settings("nonexistent", {})

    def test_error_message_lists_allowed_types(self):
        with pytest.raises(ValueError, match="hero"):
            validate_block_settings("bad", {})


# ---------------------------------------------------------------------------
# Per-type validation — happy paths
# ---------------------------------------------------------------------------


class TestValidSettings:
    """Verify that correct settings pass validation with no errors."""

    def test_hero_minimal(self):
        assert validate_block_settings("hero", {"title": "Hello"}) == []

    def test_hero_full(self):
        settings = {
            "title": "Hello",
            "subtitle": "World",
            "media_id": "12345678-abcd-1234-abcd-123456789abc",
            "cta_url": "/en/about",
        }
        assert validate_block_settings("hero", settings) == []

    def test_hero_nullable_fields(self):
        settings = {
            "title": "Title",
            "subtitle": None,
            "media_id": None,
            "cta_url": None,
        }
        assert validate_block_settings("hero", settings) == []

    def test_localized_hero_supports_media_and_projects_one_locale(self):
        settings = {
            "heading_fa": "عنوان فارسی",
            "heading_en": "English title",
            "subheading_fa": "زیرعنوان فارسی",
            "subheading_en": "English subtitle",
            "cta_text_fa": "بیشتر",
            "cta_text_en": "More",
            "cta_link": "/about",
            "media_id": None,
        }

        assert validate_block_settings("hero", settings) == []
        assert public_block_settings("hero", settings, "fa") == {
            "title": "عنوان فارسی",
            "subtitle": "زیرعنوان فارسی",
            "cta_label": "بیشتر",
            "cta_url": "/about",
            "media_id": None,
        }

    def test_text_valid(self):
        assert validate_block_settings("text", {"content": "Hi", "alignment": "start"}) == []
        assert validate_block_settings("text", {"content": "Hi", "alignment": "center"}) == []
        assert validate_block_settings("text", {"content": "Hi", "alignment": "end"}) == []

    def test_localized_text_supports_alignment_and_projects_one_locale(self):
        settings = {"body_fa": "متن فارسی", "body_en": "English text", "alignment": "center"}

        assert validate_block_settings("text", settings) == []
        assert public_block_settings("text", settings, "en") == {
            "content": "English text",
            "alignment": "center",
        }

    def test_gallery_valid(self):
        settings = {
            "media_ids": ["12345678-1234-1234-1234-123456789abc"],
            "layout": "grid",
        }
        assert validate_block_settings("gallery", settings) == []

    def test_gallery_empty_ids(self):
        settings = {"media_ids": [], "layout": "carousel"}
        assert validate_block_settings("gallery", settings) == []

    def test_cta_valid(self):
        settings = {"label": "Click", "url": "https://example.com", "variant": "primary"}
        assert validate_block_settings("cta", settings) == []

    def test_collection_valid(self):
        settings = {"source": "portfolio", "filter": {"featured": True}, "limit": 3}
        assert validate_block_settings("collection", settings) == []

    def test_quote_minimal(self):
        assert validate_block_settings("quote", {"text": "Hello"}) == []

    def test_quote_full(self):
        settings = {"text": "Hello", "attribution": "Author"}
        assert validate_block_settings("quote", settings) == []

    def test_divider_valid(self):
        assert validate_block_settings("divider", {"style": "line"}) == []
        assert validate_block_settings("divider", {"style": "space"}) == []
        assert validate_block_settings("divider", {"style": "dots"}) == []

    def test_research_focus_minimal(self):
        settings = {"title": "AI", "description": "Studying ML"}
        assert validate_block_settings("research_focus", settings) == []

    def test_research_focus_full(self):
        settings = {"title": "AI", "description": "Studying ML", "icon": "brain"}
        assert validate_block_settings("research_focus", settings) == []

    def test_composer_default_shapes_pass_every_registered_schema(self):
        animation = {"duration": 600, "delay": 0, "easing": "ease-out", "trigger": "scroll"}
        defaults = {
            "hero": {
                "heading_fa": "", "heading_en": "", "subheading_fa": "", "subheading_en": "",
                "cta_text_fa": "", "cta_text_en": "", "cta_link": "", "media_id": None,
            },
            "text": {"body_fa": "", "body_en": "", "alignment": "start"},
            "gallery": {"media_ids": [], "layout": "grid"},
            "cta": {"label": "", "url": "/", "variant": "primary"},
            "collection": {"source": "portfolio", "filter": {}, "limit": 6, "order": "default"},
            "quote": {"text": "", "attribution": None},
            "divider": {"style": "line"},
            "research_focus": {"title": "", "description": "", "icon": None},
            "scroll_reveal": {"title": "", "description": None, "direction": "up", **animation},
            "parallax": {"title": "", "subtitle": None, "media_url": None, "speed": 0.5, **animation},
            "text_stagger": {"content": "", "stagger_delay": 50, **animation},
            "fade_in_sequence": {"items": [], **animation},
            "hover_card": {"title": "", "description": "", "icon": None, "hover_effect": "lift", **animation},
            "counter_animation": {"label": "", "target_number": 0, "suffix": None, **animation},
            "image_reveal": {"media_url": "", "alt": None, "reveal_direction": "left", **animation},
            "section_transition": {"transition_type": "fade", **animation},
        }

        assert set(defaults) == set(BLOCK_SCHEMAS)
        for block_type, settings in defaults.items():
            assert validate_block_settings(block_type, settings) == [], block_type


# ---------------------------------------------------------------------------
# Per-type validation — error cases
# ---------------------------------------------------------------------------


class TestInvalidSettings:
    """Verify that incorrect settings produce meaningful errors."""

    def test_hero_missing_title(self):
        errors = validate_block_settings("hero", {})
        assert len(errors) == 1
        assert "title" in errors[0].lower() or "required" in errors[0].lower()

    def test_text_missing_required_fields(self):
        errors = validate_block_settings("text", {})
        assert len(errors) >= 2  # content and alignment both required

    def test_text_invalid_alignment_enum(self):
        errors = validate_block_settings("text", {"content": "Hi", "alignment": "oops"})
        assert len(errors) == 1
        assert "oops" in errors[0]

    def test_gallery_invalid_uuid_format(self):
        errors = validate_block_settings("gallery", {"media_ids": ["not-a-uuid"], "layout": "grid"})
        assert len(errors) == 1
        assert "not-a-uuid" in errors[0]

    def test_gallery_invalid_layout_enum(self):
        errors = validate_block_settings("gallery", {"media_ids": [], "layout": "masonry"})
        assert len(errors) == 1

    def test_cta_missing_fields(self):
        errors = validate_block_settings("cta", {})
        assert len(errors) >= 3  # label, url, variant all required

    def test_collection_invalid_limit(self):
        errors = validate_block_settings("collection", {"source": "x", "filter": {}, "limit": 0})
        assert errors  # unsupported source and limit minimum are both invalid

    def test_divider_invalid_style(self):
        errors = validate_block_settings("divider", {"style": "fancy"})
        assert len(errors) == 1

    def test_additional_properties_rejected(self):
        errors = validate_block_settings("hero", {"title": "Hi", "extra_field": True})
        assert len(errors) == 1
        assert "extra_field" in errors[0] or "additional" in errors[0].lower()

    def test_wrong_type_for_field(self):
        errors = validate_block_settings("hero", {"title": 123})
        assert len(errors) == 1
