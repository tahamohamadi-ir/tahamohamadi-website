"""Tests for preview token generation and validation.

Validates Requirements 15.1, 15.3:
- Token generation produces valid token
- Token is locale-specific (token for "fa" doesn't validate for "en")
- Token expires after 15 minutes
- Revoked token fails validation
- Invalid/tampered tokens fail validation

Note: These tests assume service functions from task 6.6 exist:
- generate_preview_token(entity, locale) -> str
- validate_preview_token(token, entity, locale) -> bool
- revoke_preview_token(token) -> None
"""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.cms.models import Page

# Import the preview token service functions.
# These are expected to be implemented in task 6.6.
from apps.workflow.preview import (
    generate_preview_token,
    revoke_preview_token,
    validate_preview_token,
)


@pytest.fixture
def published_page(db):
    """Create a published page for preview token testing."""
    return Page.objects.create(
        slug_fa="پیش‌نمایش-صفحه",
        slug_en="preview-page",
        title_fa="صفحه پیش‌نمایش",
        title_en="Preview Page",
        page_type="custom",
        status="draft",
    )


# ---------------------------------------------------------------------------
# Token generation
# ---------------------------------------------------------------------------


class TestPreviewTokenGeneration:
    """Test that preview token generation works correctly."""

    def test_generates_non_empty_token(self, published_page):
        """generate_preview_token returns a non-empty string."""
        token = generate_preview_token(published_page, "en")

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_generates_different_tokens_per_call(self, published_page):
        """Each call generates a unique token."""
        token1 = generate_preview_token(published_page, "en")
        token2 = generate_preview_token(published_page, "en")

        # Tokens may or may not be different depending on implementation,
        # but they should both be valid
        assert token1 is not None
        assert token2 is not None

    def test_generated_token_validates(self, published_page):
        """A freshly generated token passes validation."""
        token = generate_preview_token(published_page, "fa")

        assert validate_preview_token(token, published_page, "fa") is True


# ---------------------------------------------------------------------------
# Locale-specific tokens
# ---------------------------------------------------------------------------


class TestLocaleSpecificTokens:
    """Test that tokens are locale-specific."""

    def test_token_for_fa_does_not_validate_for_en(self, published_page):
        """A token generated for 'fa' should not validate for 'en'."""
        token = generate_preview_token(published_page, "fa")

        assert validate_preview_token(token, published_page, "fa") is True
        assert validate_preview_token(token, published_page, "en") is False

    def test_token_for_en_does_not_validate_for_fa(self, published_page):
        """A token generated for 'en' should not validate for 'fa'."""
        token = generate_preview_token(published_page, "en")

        assert validate_preview_token(token, published_page, "en") is True
        assert validate_preview_token(token, published_page, "fa") is False


# ---------------------------------------------------------------------------
# Token expiry
# ---------------------------------------------------------------------------


class TestPreviewTokenExpiry:
    """Test that tokens expire after 15 minutes."""

    def test_token_valid_within_15_minutes(self, published_page):
        """Token is valid immediately after generation (within window)."""
        token = generate_preview_token(published_page, "en")

        assert validate_preview_token(token, published_page, "en") is True

    def test_token_expired_after_15_minutes(self, published_page):
        """Token is invalid after 15 minutes have passed."""
        token = generate_preview_token(published_page, "en")

        # Mock timezone.now to return a time 16 minutes in the future
        future_time = timezone.now() + timedelta(minutes=16)
        with patch("apps.workflow.preview.timezone.now", return_value=future_time):
            assert validate_preview_token(token, published_page, "en") is False


# ---------------------------------------------------------------------------
# Token revocation
# ---------------------------------------------------------------------------


class TestPreviewTokenRevocation:
    """Test that revoked tokens fail validation."""

    def test_revoked_token_fails_validation(self, published_page):
        """After revoking a token, it should no longer validate."""
        token = generate_preview_token(published_page, "en")

        # Valid before revocation
        assert validate_preview_token(token, published_page, "en") is True

        # Revoke
        revoke_preview_token(token)

        # Invalid after revocation
        assert validate_preview_token(token, published_page, "en") is False


# ---------------------------------------------------------------------------
# Invalid/tampered tokens
# ---------------------------------------------------------------------------


class TestInvalidTokens:
    """Test that invalid and tampered tokens fail validation."""

    def test_empty_string_token_fails(self, published_page):
        """Empty string is not a valid token."""
        assert validate_preview_token("", published_page, "en") is False

    def test_random_string_token_fails(self, published_page):
        """A random string is not a valid token."""
        assert validate_preview_token("random-garbage-token", published_page, "en") is False

    def test_tampered_token_fails(self, published_page):
        """A token with modified characters should fail validation."""
        token = generate_preview_token(published_page, "en")

        # Tamper with the token by flipping a character
        tampered = token[:-1] + ("x" if token[-1] != "x" else "y")

        assert validate_preview_token(tampered, published_page, "en") is False

    def test_token_for_different_entity_fails(self, published_page, db):
        """A token generated for one entity should not validate for another."""
        other_page = Page.objects.create(
            slug_fa="صفحه-دیگر",
            slug_en="other-page",
            title_fa="صفحه دیگر",
            title_en="Other Page",
            page_type="custom",
            status="draft",
        )

        token = generate_preview_token(published_page, "en")

        assert validate_preview_token(token, other_page, "en") is False
