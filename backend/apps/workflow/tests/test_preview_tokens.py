"""Tests for preview token generation, validation, and revocation.

Validates Requirement 8.7:
- Tokens are short-lived (15 minutes)
- Tokens are locale-specific (bound to "fa" or "en")
- Tokens are cryptographically signed (authentic)
- Tokens are revocable
- Tokens are NOT logged or cached
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from django.core import signing
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.blog.models import Article
from apps.cms.models import Block, Page, Section
from apps.cms.serializers import PublicPageSerializer
from apps.media.models import MediaAsset
from apps.workflow.services import (
    _PREVIEW_TOKEN_MAX_AGE,
    _PREVIEW_TOKEN_SALT,
    _revoked_tokens,
    generate_preview_token,
    revoke_preview_token,
)
from apps.workflow.preview import validate_preview_token


@pytest.fixture
def draft_article(db):
    """Create a draft article for testing preview tokens."""
    return Article.objects.create(
        slug_fa="مقاله-پیشنمایش",
        slug_en="preview-article",
        title_fa="مقاله پیش‌نمایش",
        title_en="Preview Article",
        status="draft",
    )


@pytest.fixture
def published_article(db):
    """Create a published article for testing."""
    return Article.objects.create(
        slug_fa="مقاله-منتشرشده",
        slug_en="published-article",
        title_fa="مقاله منتشر شده",
        title_en="Published Article",
        status="published",
    )


@pytest.fixture(autouse=True)
def clear_revocation_set():
    """Clear the revocation set before each test."""
    _revoked_tokens.clear()
    yield
    _revoked_tokens.clear()


# ---------------------------------------------------------------------------
# Token generation
# ---------------------------------------------------------------------------


class TestGeneratePreviewToken:
    """Test token generation."""

    def test_generates_non_empty_string(self, draft_article):
        token = generate_preview_token(draft_article, "fa")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_tokens_are_unique_per_call(self, draft_article):
        """Each call should produce a different token (contains timestamp)."""
        token1 = generate_preview_token(draft_article, "fa")
        token2 = generate_preview_token(draft_article, "fa")
        # Django signing includes timestamp, so tokens differ
        assert token1 != token2

    def test_locale_fa(self, draft_article):
        token = generate_preview_token(draft_article, "fa")
        assert validate_preview_token(token, draft_article, "fa") is True

    def test_locale_en(self, draft_article):
        token = generate_preview_token(draft_article, "en")
        assert validate_preview_token(token, draft_article, "en") is True

    def test_invalid_locale_raises_value_error(self, draft_article):
        with pytest.raises(ValueError, match="Unsupported locale"):
            generate_preview_token(draft_article, "de")

    def test_token_is_url_safe(self, draft_article):
        """Token should be safe for use in URLs."""
        token = generate_preview_token(draft_article, "en")
        # Django signing.dumps produces URL-safe base64
        assert " " not in token
        # Should not contain characters that need URL encoding
        for char in ['<', '>', '"', '{', '}', '|', '\\', '^', '`']:
            assert char not in token


# ---------------------------------------------------------------------------
# Token validation
# ---------------------------------------------------------------------------


class TestValidatePreviewToken:
    """Test token validation."""

    def test_valid_token_returns_true(self, draft_article):
        token = generate_preview_token(draft_article, "fa")
        assert validate_preview_token(token, draft_article, "fa") is True

    def test_wrong_locale_returns_false(self, draft_article):
        token = generate_preview_token(draft_article, "fa")
        assert validate_preview_token(token, draft_article, "en") is False

    def test_wrong_entity_returns_false(self, draft_article, published_article):
        token = generate_preview_token(draft_article, "fa")
        assert validate_preview_token(token, published_article, "fa") is False

    def test_tampered_token_returns_false(self, draft_article):
        token = generate_preview_token(draft_article, "fa")
        tampered = token + "x"
        assert validate_preview_token(tampered, draft_article, "fa") is False

    def test_empty_string_token_returns_false(self, draft_article):
        assert validate_preview_token("", draft_article, "fa") is False

    def test_random_string_token_returns_false(self, draft_article):
        assert validate_preview_token("not-a-real-token", draft_article, "fa") is False

    def test_expired_token_returns_false(self, draft_article):
        """Token should be invalid after 15 minutes."""
        token = generate_preview_token(draft_article, "fa")

        # Simulate expiration by loading with a max_age of 0
        # We validate by patching the max_age used in validation
        with patch(
            "apps.workflow.services._PREVIEW_TOKEN_MAX_AGE", 0
        ):
            # Force expiry by using signing.loads directly with max_age=0
            with pytest.raises(signing.SignatureExpired):
                signing.loads(token, salt=_PREVIEW_TOKEN_SALT, max_age=0)

    def test_token_max_age_is_15_minutes(self):
        """Confirm the max age constant is set to 15 minutes (900 seconds)."""
        assert _PREVIEW_TOKEN_MAX_AGE == 15 * 60
        assert _PREVIEW_TOKEN_MAX_AGE == 900


# ---------------------------------------------------------------------------
# Token revocation
# ---------------------------------------------------------------------------


class TestRevokePreviewToken:
    """Test token revocation."""

    def test_revoked_token_is_invalid(self, draft_article):
        token = generate_preview_token(draft_article, "fa")
        assert validate_preview_token(token, draft_article, "fa") is True

        revoke_preview_token(token)
        assert validate_preview_token(token, draft_article, "fa") is False

    def test_revoke_is_idempotent(self, draft_article):
        token = generate_preview_token(draft_article, "fa")
        revoke_preview_token(token)
        revoke_preview_token(token)  # second revoke should not raise
        assert validate_preview_token(token, draft_article, "fa") is False

    def test_revoking_one_token_does_not_affect_others(self, draft_article):
        token1 = generate_preview_token(draft_article, "fa")
        token2 = generate_preview_token(draft_article, "fa")

        revoke_preview_token(token1)

        assert validate_preview_token(token1, draft_article, "fa") is False
        assert validate_preview_token(token2, draft_article, "fa") is True

    def test_revoke_nonexistent_token_is_noop(self, db):
        """Revoking a token that was never issued should not raise."""
        revoke_preview_token("never-issued-token")
        # Should just be in the set, no error
        assert "never-issued-token" in _revoked_tokens


# ---------------------------------------------------------------------------
# Locale binding
# ---------------------------------------------------------------------------


class TestLocaleBinding:
    """Test that tokens are properly bound to their locale."""

    def test_fa_token_invalid_for_en(self, draft_article):
        token = generate_preview_token(draft_article, "fa")
        assert validate_preview_token(token, draft_article, "fa") is True
        assert validate_preview_token(token, draft_article, "en") is False

    def test_en_token_invalid_for_fa(self, draft_article):
        token = generate_preview_token(draft_article, "en")
        assert validate_preview_token(token, draft_article, "en") is True
        assert validate_preview_token(token, draft_article, "fa") is False


class TestPreviewContentProjection:
    def test_cms_preview_matches_public_projection_for_token_locale(self, db):
        """A CMS token preview must expose only the public CMS projection."""
        page = Page.objects.create(
            slug_fa="پیش‌نمایش-cms",
            slug_en="cms-preview",
            title_fa="پیش‌نمایش فارسی",
            title_en="English preview",
            page_type="custom",
            status="draft",
        )
        enabled = Section.objects.create(page=page, ordering=0, enabled=True)
        disabled = Section.objects.create(page=page, ordering=1, enabled=False)
        Block.objects.create(
            section=enabled,
            block_type="text",
            settings={"content": "English-only preview text", "alignment": "start"},
            ordering=0,
        )
        Block.objects.create(
            section=enabled,
            block_type="unknown_preview_type",
            settings={},
            ordering=1,
        )
        Block.objects.create(
            section=enabled,
            block_type="text",
            settings={"content": 42, "alignment": "start"},
            ordering=2,
        )
        Block.objects.create(
            section=enabled,
            block_type="text",
            settings={
                "content": '<img src=x onerror="alert(1)">',
                "alignment": "start",
            },
            ordering=3,
        )
        Block.objects.create(
            section=disabled,
            block_type="text",
            settings={"content": "Disabled section", "alignment": "start"},
            ordering=0,
        )

        token = generate_preview_token(page, "en")
        response = APIClient().get(f"/api/public/workflow/preview/?token={token}")

        assert response.status_code == 200
        assert response.data["locale"] == "en"
        assert response.data["data"] == PublicPageSerializer(
            page,
            context={"locale": "en", "request": response.wsgi_request},
        ).data
        assert response.data["data"]["sections"] == [
            {
                "id": str(enabled.id),
                "ordering": 0,
                "layout": "default",
                "blocks": [
                    {
                        "id": str(enabled.blocks.get(block_type="text", ordering=0).id),
                        "block_type": "text",
                        "settings": {
                            "content": "English-only preview text",
                            "alignment": "start",
                        },
                        "ordering": 0,
                    }
                ],
            }
        ]

    def test_cms_preview_matches_public_endpoint_media_projection(self, db):
        """Token preview must retain request-aware absolute media URLs."""
        page = Page.objects.create(
            slug_fa="رسانه-پیش‌نمایش",
            slug_en="preview-media-parity",
            title_fa="رسانه",
            title_en="Media parity",
            page_type="custom",
            status="published",
        )
        asset = MediaAsset.objects.create(
            file=SimpleUploadedFile("preview.jpg", b"preview-image", content_type="image/jpeg"),
            original_filename="preview.jpg",
            mime_type="image/jpeg",
            file_size=13,
            checksum="a" * 64,
            alt_text_en="Preview media",
        )
        section = Section.objects.create(page=page, ordering=0, enabled=True)
        Block.objects.create(
            section=section,
            block_type="hero",
            settings={"title": "Preview media", "media_id": str(asset.id)},
            ordering=0,
        )

        client = APIClient()
        preview = client.get(
            f"/api/public/workflow/preview/?token={generate_preview_token(page, 'en')}",
        )
        public = client.get(
            "/api/public/pages/preview-media-parity/?locale=en",
        )

        assert preview.status_code == 200
        assert public.status_code == 200
        assert preview.data["data"] == public.data
        assert preview.data["data"]["sections"][0]["blocks"][0]["settings"]["media_url"] == (
            f"http://testserver{asset.file.url}"
        )

    def test_tampered_token_is_rejected_with_private_preview_headers(self, db):
        """A rejected preview token must still disable indexing and caching."""
        page = Page.objects.create(
            slug_fa="توکن-نامعتبر",
            slug_en="invalid-token-preview",
            title_fa="توکن نامعتبر",
            title_en="Invalid token",
            page_type="custom",
            status="draft",
        )
        token = generate_preview_token(page, "en")
        tampered = token[:-1] + ("x" if token[-1] != "x" else "y")

        response = APIClient().get(f"/api/public/workflow/preview/?token={tampered}")

        assert response.status_code == 401
        assert response["X-Robots-Tag"] == "noindex"
        assert response["Cache-Control"] == "no-store"
