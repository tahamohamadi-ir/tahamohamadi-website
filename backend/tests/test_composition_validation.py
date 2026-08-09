"""Tests for page composition validation service.

Validates: Requirements 4.7, 12.2
- Ordering contiguity (no gaps, no duplicates)
- Block type validation (reject unknown types)
- Block settings validation (schema enforcement)
- Media reference UUID format validation
- URL safety (CTA URLs must be internal locale-aware or HTTPS)
"""

import uuid

import pytest

from apps.cms.services import (
    extract_media_ids,
    is_safe_url,
    validate_page_composition,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_uuid() -> str:
    return str(uuid.uuid4())


def _valid_page(sections=None):
    """Build a minimal valid page_data dict."""
    if sections is None:
        sections = [
            {
                "ordering": 0,
                "blocks": [
                    {
                        "block_type": "text",
                        "settings": {"content": "Hello", "alignment": "start"},
                        "ordering": 0,
                    }
                ],
            }
        ]
    return {"sections": sections}


# ---------------------------------------------------------------------------
# Tests: valid composition passes
# ---------------------------------------------------------------------------

class TestValidComposition:
    def test_empty_sections_is_valid(self):
        errors = validate_page_composition({"sections": []})
        assert errors == []

    def test_single_section_single_block_valid(self):
        page = _valid_page()
        errors = validate_page_composition(page)
        assert errors == []

    def test_multiple_sections_and_blocks_valid(self):
        media_id = _make_uuid()
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "hero",
                            "settings": {
                                "title": "Welcome",
                                "subtitle": None,
                                "media_id": media_id,
                                "cta_url": "/en/portfolio",
                            },
                            "ordering": 0,
                        },
                    ],
                },
                {
                    "ordering": 1,
                    "blocks": [
                        {
                            "block_type": "text",
                            "settings": {"content": "Body", "alignment": "center"},
                            "ordering": 0,
                        },
                        {
                            "block_type": "divider",
                            "settings": {"style": "line"},
                            "ordering": 1,
                        },
                    ],
                },
            ]
        )
        errors = validate_page_composition(page)
        assert errors == []

    def test_1_based_ordering_is_valid(self):
        """Both 0-based and 1-based contiguous ordering should pass."""
        page = _valid_page(
            sections=[
                {
                    "ordering": 1,
                    "blocks": [
                        {
                            "block_type": "text",
                            "settings": {"content": "A", "alignment": "start"},
                            "ordering": 1,
                        },
                        {
                            "block_type": "text",
                            "settings": {"content": "B", "alignment": "end"},
                            "ordering": 2,
                        },
                    ],
                },
                {
                    "ordering": 2,
                    "blocks": [],
                },
            ]
        )
        errors = validate_page_composition(page)
        assert errors == []


# ---------------------------------------------------------------------------
# Tests: ordering gaps detected
# ---------------------------------------------------------------------------

class TestOrderingGaps:
    def test_section_ordering_gap(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "text",
                            "settings": {"content": "A", "alignment": "start"},
                            "ordering": 0,
                        }
                    ],
                },
                {
                    "ordering": 2,  # gap: missing 1
                    "blocks": [],
                },
            ]
        )
        errors = validate_page_composition(page)
        assert any("gap" in e.lower() for e in errors)

    def test_block_ordering_gap(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "text",
                            "settings": {"content": "A", "alignment": "start"},
                            "ordering": 0,
                        },
                        {
                            "block_type": "text",
                            "settings": {"content": "B", "alignment": "start"},
                            "ordering": 3,  # gap: missing 1, 2
                        },
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert any("gap" in e.lower() for e in errors)


# ---------------------------------------------------------------------------
# Tests: duplicate orderings detected
# ---------------------------------------------------------------------------

class TestDuplicateOrderings:
    def test_section_ordering_duplicate(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 1,
                    "blocks": [],
                },
                {
                    "ordering": 1,  # duplicate
                    "blocks": [],
                },
            ]
        )
        errors = validate_page_composition(page)
        assert any("duplicate" in e.lower() for e in errors)

    def test_block_ordering_duplicate(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "text",
                            "settings": {"content": "A", "alignment": "start"},
                            "ordering": 0,
                        },
                        {
                            "block_type": "text",
                            "settings": {"content": "B", "alignment": "start"},
                            "ordering": 0,  # duplicate
                        },
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert any("duplicate" in e.lower() for e in errors)


# ---------------------------------------------------------------------------
# Tests: unknown block types rejected
# ---------------------------------------------------------------------------

class TestUnknownBlockTypes:
    def test_unknown_block_type(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "nonexistent_widget",
                            "settings": {},
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert any("unknown block_type" in e.lower() for e in errors)
        assert any("nonexistent_widget" in e for e in errors)


# ---------------------------------------------------------------------------
# Tests: invalid settings caught
# ---------------------------------------------------------------------------

class TestInvalidSettings:
    def test_missing_required_field(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "text",
                            "settings": {"content": "A"},  # missing 'alignment'
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert len(errors) > 0
        assert any("alignment" in e.lower() for e in errors)

    def test_invalid_enum_value(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "text",
                            "settings": {"content": "A", "alignment": "invalid"},
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert len(errors) > 0

    @pytest.mark.parametrize("content", ["<script>alert(1)</script>", "<p>Raw HTML</p>"])
    def test_raw_html_is_rejected_for_saved_compositions(self, content):
        page = _valid_page()
        page["sections"][0]["blocks"][0]["settings"]["content"] = content

        errors = validate_page_composition(page)

        assert errors == [
            "sections[0].blocks[0]: settings must not contain raw HTML"
        ]


# ---------------------------------------------------------------------------
# Tests: unsafe URLs rejected
# ---------------------------------------------------------------------------

class TestUnsafeUrls:
    @pytest.mark.parametrize(
        "url",
        [
            "javascript:alert(1)",
            "http://example.com",
            "data:text/html,<script>alert(1)</script>",
            "ftp://files.example.com",
            "//example.com",
            "JAVASCRIPT:void(0)",
        ],
    )
    def test_unsafe_cta_url_in_hero(self, url):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "hero",
                            "settings": {
                                "title": "Test",
                                "subtitle": None,
                                "media_id": None,
                                "cta_url": url,
                            },
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert any("unsafe" in e.lower() for e in errors)

    @pytest.mark.parametrize(
        "url",
        [
            "javascript:alert(1)",
            "http://evil.com",
            "data:text/html,<h1>hi</h1>",
        ],
    )
    def test_unsafe_url_in_cta_block(self, url):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "cta",
                            "settings": {
                                "label": "Click",
                                "url": url,
                                "variant": "primary",
                            },
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert any("unsafe" in e.lower() for e in errors)


# ---------------------------------------------------------------------------
# Tests: safe URLs pass
# ---------------------------------------------------------------------------

class TestSafeUrls:
    @pytest.mark.parametrize(
        "url",
        [
            "/fa/about",
            "/en/portfolio",
            "/",
            "/fa/",
            "https://example.com",
            "https://example.com/path?q=1",
        ],
    )
    def test_safe_cta_url_in_hero(self, url):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "hero",
                            "settings": {
                                "title": "Test",
                                "subtitle": None,
                                "media_id": None,
                                "cta_url": url,
                            },
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert errors == []

    @pytest.mark.parametrize(
        "url",
        [
            "/fa/contact",
            "/en/blog",
            "https://github.com/user",
        ],
    )
    def test_safe_url_in_cta_block(self, url):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "cta",
                            "settings": {
                                "label": "Go",
                                "url": url,
                                "variant": "secondary",
                            },
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert errors == []


# ---------------------------------------------------------------------------
# Tests: media reference validation
# ---------------------------------------------------------------------------

class TestMediaReferences:
    def test_valid_uuid_format_passes(self):
        mid = _make_uuid()
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "hero",
                            "settings": {
                                "title": "Hi",
                                "subtitle": None,
                                "media_id": mid,
                                "cta_url": None,
                            },
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert errors == []

    def test_invalid_uuid_format_rejected(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "hero",
                            "settings": {
                                "title": "Hi",
                                "subtitle": None,
                                "media_id": "not-a-valid-uuid",
                                "cta_url": None,
                            },
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert any("invalid media uuid" in e.lower() for e in errors)

    def test_gallery_media_ids_invalid_uuid(self):
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "gallery",
                            "settings": {
                                "media_ids": [_make_uuid(), "bad-id"],
                                "layout": "grid",
                            },
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page)
        assert any("invalid media uuid" in e.lower() for e in errors)

    def test_known_media_ids_check(self):
        """When known_media_ids is provided, non-existent IDs are flagged."""
        existing_id = _make_uuid()
        missing_id = _make_uuid()
        page = _valid_page(
            sections=[
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "block_type": "gallery",
                            "settings": {
                                "media_ids": [existing_id, missing_id],
                                "layout": "carousel",
                            },
                            "ordering": 0,
                        }
                    ],
                }
            ]
        )
        errors = validate_page_composition(page, known_media_ids={existing_id})
        assert any("not found" in e.lower() for e in errors)
        assert any(missing_id in e for e in errors)
        # existing_id should not be in errors
        assert not any(existing_id in e for e in errors)


# ---------------------------------------------------------------------------
# Tests: is_safe_url helper
# ---------------------------------------------------------------------------

class TestIsSafeUrl:
    @pytest.mark.parametrize(
        "url,expected",
        [
            ("/fa/about", True),
            ("/en/blog", True),
            ("/", True),
            ("https://example.com", True),
            ("https://example.com/path", True),
            ("http://example.com", False),
            ("javascript:alert(1)", False),
            ("data:text/html,hi", False),
            ("ftp://files.com", False),
            ("//evil.com", False),
            ("", False),
            (None, False),
        ],
    )
    def test_url_safety(self, url, expected):
        assert is_safe_url(url) == expected


# ---------------------------------------------------------------------------
# Tests: extract_media_ids helper
# ---------------------------------------------------------------------------

class TestExtractMediaIds:
    def test_single_media_id(self):
        mid = _make_uuid()
        result = extract_media_ids({"media_id": mid})
        assert result == [mid]

    def test_media_ids_list(self):
        ids = [_make_uuid(), _make_uuid()]
        result = extract_media_ids({"media_ids": ids})
        assert result == ids

    def test_both_media_id_and_media_ids(self):
        single = _make_uuid()
        multi = [_make_uuid(), _make_uuid()]
        result = extract_media_ids({"media_id": single, "media_ids": multi})
        assert result == [single] + multi

    def test_none_media_id_excluded(self):
        result = extract_media_ids({"media_id": None})
        assert result == []

    def test_empty_settings(self):
        result = extract_media_ids({})
        assert result == []

    def test_non_dict_settings(self):
        result = extract_media_ids("not a dict")
        assert result == []
