"""
Tests for RC-003 Rich Content Security requirement:
Verify sanitization rules against XSS vectors, inline event handlers,
unsafe schemes, and SVG script injection.
"""

import pytest
from django.core.exceptions import ValidationError
from apps.blog.services import (
    sanitize_block_content,
    sanitize_article_blocks,
    validate_article_content,
)


class TestRichContentSecurityRC003:
    """RC-003 test suite for rich content security and sanitization."""

    def test_strip_script_tags(self):
        content = {"text": "Hello <script>alert('XSS')</script> World"}
        with pytest.raises(ValidationError):
            sanitize_block_content("paragraph", content)

    def test_strip_inline_event_handlers(self):
        content = {"alt": "Test <img src=x onerror=alert(1)>"}
        with pytest.raises(ValidationError):
            sanitize_block_content("paragraph", content)

    def test_strip_javascript_pseudo_protocol(self):
        content = {"url": "javascript:alert(1)", "title": "Test"}
        with pytest.raises(ValidationError):
            sanitize_block_content("reference", content)

    def test_svg_script_tag_rejection(self):
        content = {"text": "<svg><script>alert('XSS')</script></svg>"}
        with pytest.raises(ValidationError):
            sanitize_block_content("paragraph", content)

    def test_iframe_rejection(self):
        content = {"text": "<iframe src='https://malicious.com'></iframe>"}
        with pytest.raises(ValidationError):
            sanitize_block_content("paragraph", content)

    def test_clean_text_preserved(self):
        content = {"text": "This is a clean paragraph text"}
        sanitized = sanitize_block_content("paragraph", content)
        assert sanitized["text"] == "This is a clean paragraph text"

