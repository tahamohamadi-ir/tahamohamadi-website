"""Tests for blog article content sanitization (Req 6.4, 12.1).

Validates: Requirements 6.4, 12.1
"""

import pytest
from django.core.exceptions import ValidationError

from apps.blog.services import (
    is_safe_url,
    sanitize_article_blocks,
    sanitize_block_content,
    validate_article_content,
)


# ---------------------------------------------------------------------------
# is_safe_url tests
# ---------------------------------------------------------------------------


class TestIsSafeUrl:
    """Tests for URL safety validation."""

    def test_https_url_is_safe(self):
        assert is_safe_url("https://example.com") is True

    def test_https_url_with_path_is_safe(self):
        assert is_safe_url("https://example.com/path/to/page") is True

    def test_internal_path_is_safe(self):
        assert is_safe_url("/en/blog/post-1") is True

    def test_internal_fa_path_is_safe(self):
        assert is_safe_url("/fa/blog/post-1") is True

    def test_root_path_is_safe(self):
        assert is_safe_url("/") is True

    def test_http_url_is_unsafe(self):
        assert is_safe_url("http://example.com") is False

    def test_javascript_url_is_unsafe(self):
        assert is_safe_url("javascript:alert(1)") is False

    def test_data_url_is_unsafe(self):
        assert is_safe_url("data:text/html,<script>") is False

    def test_ftp_url_is_unsafe(self):
        assert is_safe_url("ftp://server.com") is False

    def test_protocol_relative_is_unsafe(self):
        assert is_safe_url("//evil.com") is False

    def test_empty_string_is_unsafe(self):
        assert is_safe_url("") is False

    def test_none_is_unsafe(self):
        assert is_safe_url(None) is False

    def test_whitespace_only_is_unsafe(self):
        assert is_safe_url("   ") is False


# ---------------------------------------------------------------------------
# sanitize_block_content tests
# ---------------------------------------------------------------------------


class TestSanitizeBlockContent:
    """Tests for individual block content sanitization."""

    # --- Text blocks ---

    def test_paragraph_strips_html_tags(self):
        content = {"text": "Hello <b>world</b>"}
        result = sanitize_block_content("paragraph", content)
        assert result["text"] == "Hello world"

    def test_heading_strips_html_tags(self):
        content = {"text": "<h2>Title</h2>"}
        result = sanitize_block_content("heading", content)
        assert result["text"] == "Title"

    def test_paragraph_rejects_script_tags(self):
        content = {"text": "Hello <script>alert('xss')</script>"}
        with pytest.raises(ValidationError, match="Dangerous content"):
            sanitize_block_content("paragraph", content)

    def test_paragraph_rejects_iframe(self):
        content = {"text": "Hello <iframe src='evil.com'></iframe>"}
        with pytest.raises(ValidationError, match="Dangerous content"):
            sanitize_block_content("paragraph", content)

    def test_paragraph_rejects_javascript_url(self):
        content = {"text": "Click javascript:alert(1)"}
        with pytest.raises(ValidationError, match="Dangerous content"):
            sanitize_block_content("paragraph", content)

    def test_paragraph_rejects_data_url(self):
        content = {"text": "Look data:text/html,<script>x</script>"}
        with pytest.raises(ValidationError, match="Dangerous content"):
            sanitize_block_content("paragraph", content)

    def test_list_block_sanitizes_items(self):
        content = {"items": ["<em>item1</em>", "item2 <span>styled</span>"]}
        result = sanitize_block_content("list", content)
        assert result["items"] == ["item1", "item2 styled"]

    def test_list_block_rejects_script_in_items(self):
        content = {"items": ["safe", "<script>evil</script>"]}
        with pytest.raises(ValidationError, match="Dangerous content"):
            sanitize_block_content("list", content)

    def test_quote_strips_html(self):
        content = {"text": "<p>A wise quote</p>", "author": "<b>Author</b>"}
        result = sanitize_block_content("quote", content)
        assert result["text"] == "A wise quote"
        assert result["author"] == "Author"

    def test_callout_strips_html(self):
        content = {"text": "<div>Important</div>", "type": "warning"}
        result = sanitize_block_content("callout", content)
        assert result["text"] == "Important"
        assert result["type"] == "warning"

    # --- Code blocks (allowed as-is) ---

    def test_code_block_preserves_html_content(self):
        content = {"code": "<script>console.log('hello')</script>", "language": "html"}
        result = sanitize_block_content("code", content)
        assert result["code"] == "<script>console.log('hello')</script>"
        assert result["language"] == "html"

    # --- Divider blocks ---

    def test_divider_block_passes_through(self):
        content = {"style": "dashed"}
        result = sanitize_block_content("divider", content)
        assert result == {"style": "dashed"}

    # --- Media blocks ---

    def test_image_block_with_valid_uuid(self):
        content = {"media_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}
        result = sanitize_block_content("image", content)
        assert result["media_id"] == "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

    def test_image_block_rejects_invalid_media_id(self):
        content = {"media_id": "not-a-uuid"}
        with pytest.raises(ValidationError, match="Invalid media_id"):
            sanitize_block_content("image", content)

    def test_gallery_block_with_valid_uuids(self):
        content = {
            "media_ids": [
                "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            ]
        }
        result = sanitize_block_content("gallery", content)
        assert len(result["media_ids"]) == 2

    def test_gallery_block_rejects_invalid_uuid_in_list(self):
        content = {
            "media_ids": [
                "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "invalid",
            ]
        }
        with pytest.raises(ValidationError, match="Invalid media_ids"):
            sanitize_block_content("gallery", content)

    def test_gallery_block_rejects_non_list_media_ids(self):
        content = {"media_ids": "not-a-list"}
        with pytest.raises(ValidationError, match="must be a list"):
            sanitize_block_content("gallery", content)

    def test_image_block_sanitizes_alt_text(self):
        content = {
            "media_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "alt": "A <b>bold</b> image",
        }
        result = sanitize_block_content("image", content)
        assert result["alt"] == "A bold image"

    # --- Reference blocks ---

    def test_reference_block_with_safe_https_url(self):
        content = {"url": "https://example.com", "title": "Example"}
        result = sanitize_block_content("reference", content)
        assert result["url"] == "https://example.com"
        assert result["title"] == "Example"

    def test_reference_block_with_safe_internal_url(self):
        content = {"url": "/en/about", "title": "About"}
        result = sanitize_block_content("reference", content)
        assert result["url"] == "/en/about"

    def test_reference_block_rejects_javascript_url(self):
        content = {"url": "javascript:alert(1)", "title": "Evil"}
        with pytest.raises(ValidationError, match="Dangerous content"):
            sanitize_block_content("reference", content)

    def test_reference_block_rejects_http_url(self):
        content = {"url": "http://insecure.com", "title": "Insecure"}
        with pytest.raises(ValidationError, match="Unsafe URL"):
            sanitize_block_content("reference", content)

    def test_reference_block_strips_html_from_title(self):
        content = {"url": "https://example.com", "title": "<b>Title</b>"}
        result = sanitize_block_content("reference", content)
        assert result["title"] == "Title"

    # --- Invalid content type ---

    def test_non_dict_content_raises_error(self):
        with pytest.raises(ValidationError, match="must be a dict"):
            sanitize_block_content("paragraph", "string content")


# ---------------------------------------------------------------------------
# sanitize_article_blocks tests
# ---------------------------------------------------------------------------


class TestSanitizeArticleBlocks:
    """Tests for article-level block sanitization."""

    def test_sanitizes_multiple_blocks(self):
        blocks = [
            {"block_type": "paragraph", "content": {"text": "Hello <b>world</b>"}},
            {"block_type": "heading", "content": {"text": "<h1>Title</h1>", "level": 2}},
        ]
        sanitized, warnings = sanitize_article_blocks(blocks)
        assert sanitized[0]["content"]["text"] == "Hello world"
        assert sanitized[1]["content"]["text"] == "Title"
        assert sanitized[1]["content"]["level"] == 2

    def test_generates_warnings_for_stripped_html(self):
        blocks = [
            {"block_type": "paragraph", "content": {"text": "Clean text"}},
            {"block_type": "paragraph", "content": {"text": "<em>Styled</em>"}},
        ]
        sanitized, warnings = sanitize_article_blocks(blocks)
        assert len(warnings) >= 1
        assert "HTML tags were stripped" in warnings[0]

    def test_raises_on_script_tag(self):
        blocks = [
            {"block_type": "paragraph", "content": {"text": "<script>bad</script>"}},
        ]
        with pytest.raises(ValidationError):
            sanitize_article_blocks(blocks)

    def test_preserves_code_blocks(self):
        blocks = [
            {"block_type": "code", "content": {"code": "<div>html</div>", "language": "html"}},
        ]
        sanitized, warnings = sanitize_article_blocks(blocks)
        assert sanitized[0]["content"]["code"] == "<div>html</div>"
        assert len(warnings) == 0

    def test_rejects_non_list_input(self):
        with pytest.raises(ValidationError, match="must be a list"):
            sanitize_article_blocks("not a list")

    def test_rejects_non_dict_block(self):
        with pytest.raises(ValidationError, match="must be a dict"):
            sanitize_article_blocks(["string block"])

    def test_rejects_missing_block_type(self):
        blocks = [{"content": {"text": "hello"}}]
        with pytest.raises(ValidationError, match="block_type"):
            sanitize_article_blocks(blocks)

    def test_preserves_non_content_keys(self):
        blocks = [
            {
                "block_type": "paragraph",
                "content": {"text": "hello"},
                "ordering": 1,
                "locale": "en",
            },
        ]
        sanitized, _ = sanitize_article_blocks(blocks)
        assert sanitized[0]["ordering"] == 1
        assert sanitized[0]["locale"] == "en"


# ---------------------------------------------------------------------------
# validate_article_content tests
# ---------------------------------------------------------------------------


class TestValidateArticleContent:
    """Tests for validation-only (no modification) function."""

    def test_valid_content_returns_empty_list(self):
        blocks = [
            {"block_type": "paragraph", "content": {"text": "Hello world"}},
            {"block_type": "code", "content": {"code": "<script>ok</script>"}},
        ]
        errors = validate_article_content(blocks)
        assert errors == []

    def test_detects_script_tag(self):
        blocks = [
            {"block_type": "paragraph", "content": {"text": "<script>bad</script>"}},
        ]
        errors = validate_article_content(blocks)
        assert len(errors) == 1
        assert "dangerous content" in errors[0]

    def test_detects_raw_html(self):
        blocks = [
            {"block_type": "paragraph", "content": {"text": "<b>bold</b>"}},
        ]
        errors = validate_article_content(blocks)
        assert len(errors) == 1
        assert "raw HTML" in errors[0]

    def test_detects_unsafe_url_in_reference(self):
        blocks = [
            {"block_type": "reference", "content": {"url": "http://insecure.com"}},
        ]
        errors = validate_article_content(blocks)
        assert len(errors) == 1
        assert "unsafe URL" in errors[0]

    def test_detects_invalid_media_id(self):
        blocks = [
            {"block_type": "image", "content": {"media_id": "not-a-uuid"}},
        ]
        errors = validate_article_content(blocks)
        assert len(errors) == 1
        assert "invalid media_id" in errors[0]

    def test_detects_invalid_media_ids_in_gallery(self):
        blocks = [
            {
                "block_type": "gallery",
                "content": {
                    "media_ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890", "bad"]
                },
            },
        ]
        errors = validate_article_content(blocks)
        assert len(errors) == 1
        assert "media_ids" in errors[0]

    def test_code_block_no_errors(self):
        """Code blocks should not report errors even with HTML/script content."""
        blocks = [
            {"block_type": "code", "content": {"code": "<script>alert(1)</script>"}},
        ]
        errors = validate_article_content(blocks)
        assert errors == []

    def test_non_list_input_returns_error(self):
        errors = validate_article_content("not a list")
        assert len(errors) == 1

    def test_multiple_errors_detected(self):
        blocks = [
            {"block_type": "paragraph", "content": {"text": "<script>x</script>"}},
            {"block_type": "image", "content": {"media_id": "bad"}},
            {"block_type": "reference", "content": {"url": "javascript:evil()"}},
        ]
        errors = validate_article_content(blocks)
        assert len(errors) == 3

    def test_detects_dangerous_content_in_list_items(self):
        blocks = [
            {"block_type": "list", "content": {"items": ["ok", "<script>x</script>"]}},
        ]
        errors = validate_article_content(blocks)
        assert len(errors) == 1
        assert "dangerous content" in errors[0]
