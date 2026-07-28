"""Tests for TOC generation from article heading blocks (Requirement 6.8)."""

import pytest

from apps.blog.services import generate_heading_slug, generate_toc


# ---------------------------------------------------------------------------
# Tests for generate_heading_slug
# ---------------------------------------------------------------------------


class TestGenerateHeadingSlug:
    """Tests for the heading slug generation utility."""

    def test_english_simple(self):
        """Simple English text produces lowercase hyphenated slug."""
        assert generate_heading_slug("Hello World") == "hello-world"

    def test_english_mixed_case(self):
        """Mixed case is lowercased."""
        assert generate_heading_slug("Getting Started With Django") == "getting-started-with-django"

    def test_english_special_chars(self):
        """Special characters are removed."""
        assert generate_heading_slug("What's New? (v2.0)") == "whats-new-v20"

    def test_persian_text(self):
        """Persian text is preserved (not lowercased) and spaces become hyphens."""
        result = generate_heading_slug("سلام دنیا")
        assert result == "سلام-دنیا"

    def test_persian_with_numbers(self):
        """Persian text with numbers."""
        result = generate_heading_slug("بخش ۱: مقدمه")
        assert result == "بخش-۱-مقدمه"

    def test_multiple_spaces(self):
        """Multiple spaces collapse to single hyphen."""
        assert generate_heading_slug("hello   world") == "hello-world"

    def test_leading_trailing_spaces(self):
        """Leading and trailing spaces are stripped."""
        assert generate_heading_slug("  hello world  ") == "hello-world"

    def test_empty_string(self):
        """Empty string returns empty string."""
        assert generate_heading_slug("") == ""

    def test_none_input(self):
        """None input returns empty string."""
        assert generate_heading_slug(None) == ""

    def test_only_special_chars(self):
        """String with only special characters returns empty."""
        assert generate_heading_slug("!@#$%^&*()") == ""

    def test_underscores_become_hyphens(self):
        """Underscores are converted to hyphens."""
        assert generate_heading_slug("hello_world_test") == "hello-world-test"

    def test_mixed_persian_english(self):
        """Mixed Persian and English text."""
        result = generate_heading_slug("Django فریم‌ورک")
        # The zero-width non-joiner (‌) should be removed
        assert "django" in result


# ---------------------------------------------------------------------------
# Tests for generate_toc
# ---------------------------------------------------------------------------


class TestGenerateToc:
    """Tests for TOC generation from article blocks."""

    def test_single_heading(self):
        """Single heading block produces one TOC entry."""
        blocks = [
            {
                "block_type": "heading",
                "content": {"text": "Introduction", "level": 2},
                "locale": "en",
                "ordering": 1,
            }
        ]
        result = generate_toc(blocks, "en")
        assert len(result) == 1
        assert result[0] == {"id": "introduction", "text": "Introduction", "level": 2}

    def test_multiple_headings_different_levels(self):
        """Multiple headings at different levels."""
        blocks = [
            {
                "block_type": "heading",
                "content": {"text": "Chapter One", "level": 1},
                "locale": "en",
                "ordering": 1,
            },
            {
                "block_type": "paragraph",
                "content": {"text": "Some text here."},
                "locale": "en",
                "ordering": 2,
            },
            {
                "block_type": "heading",
                "content": {"text": "Section A", "level": 2},
                "locale": "en",
                "ordering": 3,
            },
            {
                "block_type": "heading",
                "content": {"text": "Subsection", "level": 3},
                "locale": "en",
                "ordering": 4,
            },
        ]
        result = generate_toc(blocks, "en")
        assert len(result) == 3
        assert result[0] == {"id": "chapter-one", "text": "Chapter One", "level": 1}
        assert result[1] == {"id": "section-a", "text": "Section A", "level": 2}
        assert result[2] == {"id": "subsection", "text": "Subsection", "level": 3}

    def test_duplicate_heading_text_dedup(self):
        """Duplicate heading texts get disambiguated slugs."""
        blocks = [
            {
                "block_type": "heading",
                "content": {"text": "Summary", "level": 2},
                "locale": "en",
                "ordering": 1,
            },
            {
                "block_type": "heading",
                "content": {"text": "Summary", "level": 2},
                "locale": "en",
                "ordering": 2,
            },
            {
                "block_type": "heading",
                "content": {"text": "Summary", "level": 2},
                "locale": "en",
                "ordering": 3,
            },
        ]
        result = generate_toc(blocks, "en")
        assert len(result) == 3
        assert result[0]["id"] == "summary"
        assert result[1]["id"] == "summary-1"
        assert result[2]["id"] == "summary-2"

    def test_persian_headings(self):
        """Persian heading text produces proper slugs."""
        blocks = [
            {
                "block_type": "heading",
                "content": {"text": "مقدمه", "level": 1},
                "locale": "fa",
                "ordering": 1,
            },
            {
                "block_type": "heading",
                "content": {"text": "نتیجه‌گیری", "level": 2},
                "locale": "fa",
                "ordering": 2,
            },
        ]
        result = generate_toc(blocks, "fa")
        assert len(result) == 2
        assert result[0]["text"] == "مقدمه"
        assert result[0]["level"] == 1
        assert result[0]["id"] == "مقدمه"
        assert result[1]["text"] == "نتیجه‌گیری"
        assert result[1]["level"] == 2

    def test_mixed_locales_only_target_included(self):
        """Only blocks matching the target locale are included."""
        blocks = [
            {
                "block_type": "heading",
                "content": {"text": "Introduction", "level": 2},
                "locale": "en",
                "ordering": 1,
            },
            {
                "block_type": "heading",
                "content": {"text": "مقدمه", "level": 2},
                "locale": "fa",
                "ordering": 2,
            },
            {
                "block_type": "heading",
                "content": {"text": "Conclusion", "level": 2},
                "locale": "en",
                "ordering": 3,
            },
        ]
        en_result = generate_toc(blocks, "en")
        assert len(en_result) == 2
        assert en_result[0]["text"] == "Introduction"
        assert en_result[1]["text"] == "Conclusion"

        fa_result = generate_toc(blocks, "fa")
        assert len(fa_result) == 1
        assert fa_result[0]["text"] == "مقدمه"

    def test_empty_blocks_returns_empty(self):
        """Empty block list returns empty TOC."""
        assert generate_toc([], "en") == []

    def test_no_headings_returns_empty(self):
        """Blocks with no headings return empty TOC."""
        blocks = [
            {
                "block_type": "paragraph",
                "content": {"text": "Just a paragraph."},
                "locale": "en",
                "ordering": 1,
            },
            {
                "block_type": "code",
                "content": {"code": "print('hello')", "language": "python"},
                "locale": "en",
                "ordering": 2,
            },
        ]
        assert generate_toc(blocks, "en") == []

    def test_none_blocks_returns_empty(self):
        """None input returns empty list."""
        assert generate_toc(None, "en") == []

    def test_heading_with_empty_text_skipped(self):
        """Heading blocks with empty text are skipped."""
        blocks = [
            {
                "block_type": "heading",
                "content": {"text": "", "level": 2},
                "locale": "en",
                "ordering": 1,
            },
            {
                "block_type": "heading",
                "content": {"text": "Valid Heading", "level": 2},
                "locale": "en",
                "ordering": 2,
            },
        ]
        result = generate_toc(blocks, "en")
        assert len(result) == 1
        assert result[0]["text"] == "Valid Heading"

    def test_non_dict_blocks_skipped(self):
        """Non-dict entries in the block list are skipped gracefully."""
        blocks = [
            None,
            "not a block",
            {
                "block_type": "heading",
                "content": {"text": "Valid", "level": 2},
                "locale": "en",
                "ordering": 1,
            },
        ]
        result = generate_toc(blocks, "en")
        assert len(result) == 1
        assert result[0]["text"] == "Valid"
