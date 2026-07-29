"""Tests for translation status computation.

Validates Requirements 15.1, 15.2, 15.3, 15.8:
- Compute translation status per locale: Missing, Incomplete, Complete, Outdated
- When source locale content changes, mark other locale as Outdated
"""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.blog.models import Article
from apps.workflow.translation import (
    compute_translation_status,
    get_translation_status_for_entity,
)


@pytest.fixture
def article_no_target(db):
    """Article with English content but no Persian content (empty target)."""
    return Article.objects.create(
        slug_fa="slug-fa",
        slug_en="test-translation",
        title_fa="",
        title_en="Test Article",
        excerpt_fa="",
        excerpt_en="This is the English excerpt.",
        status="draft",
    )


@pytest.fixture
def article_partial_target(db):
    """Article with partial Persian content (title filled, excerpt empty)."""
    return Article.objects.create(
        slug_fa="slug-partial",
        slug_en="partial-translation",
        title_fa="مقاله تست",
        title_en="Test Article",
        excerpt_fa="",
        excerpt_en="English excerpt here.",
        status="draft",
    )


@pytest.fixture
def article_complete(db):
    """Article with all locale fields filled for both locales."""
    return Article.objects.create(
        slug_fa="slug-complete",
        slug_en="complete-translation",
        title_fa="مقاله کامل",
        title_en="Complete Article",
        excerpt_fa="خلاصه فارسی",
        excerpt_en="English excerpt.",
        status="draft",
    )


@pytest.fixture
def article_outdated(db):
    """Article where source locale was updated after target locale."""
    now = timezone.now()
    return Article.objects.create(
        slug_fa="slug-outdated",
        slug_en="outdated-translation",
        title_fa="مقاله قدیمی",
        title_en="Updated English Title",
        excerpt_fa="خلاصه فارسی",
        excerpt_en="Updated English excerpt.",
        status="draft",
        locale_updated_at={
            "en": (now - timedelta(hours=1)).isoformat(),
            "fa": (now - timedelta(hours=5)).isoformat(),
        },
    )


# ---------------------------------------------------------------------------
# Missing status
# ---------------------------------------------------------------------------


class TestMissingStatus:
    """Entity with no target locale content returns 'missing'."""

    def test_fa_missing_when_all_fa_fields_empty(self, article_no_target):
        status = compute_translation_status(article_no_target, "fa")
        assert status == "missing"

    def test_en_missing_when_all_en_fields_empty(self, db):
        article = Article.objects.create(
            slug_fa="slug-en-missing",
            slug_en="en-missing",
            title_fa="عنوان فارسی",
            title_en="",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="",
            status="draft",
        )
        status = compute_translation_status(article, "en")
        assert status == "missing"


# ---------------------------------------------------------------------------
# Incomplete status
# ---------------------------------------------------------------------------


class TestIncompleteStatus:
    """Entity with partial target locale content returns 'incomplete'."""

    def test_fa_incomplete_when_some_fields_empty(self, article_partial_target):
        status = compute_translation_status(article_partial_target, "fa")
        assert status == "incomplete"

    def test_en_incomplete_when_some_fields_empty(self, db):
        article = Article.objects.create(
            slug_fa="slug-en-partial",
            slug_en="en-partial",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="",
            status="draft",
        )
        status = compute_translation_status(article, "en")
        assert status == "incomplete"


# ---------------------------------------------------------------------------
# Complete status
# ---------------------------------------------------------------------------


class TestCompleteStatus:
    """Entity with all target locale content filled returns 'complete'."""

    def test_fa_complete_when_all_fields_filled(self, article_complete):
        status = compute_translation_status(article_complete, "fa")
        assert status == "complete"

    def test_en_complete_when_all_fields_filled(self, article_complete):
        status = compute_translation_status(article_complete, "en")
        assert status == "complete"

    def test_complete_with_no_locale_timestamps(self, article_complete):
        """Without locale_updated_at timestamps, filled fields → complete."""
        article_complete.locale_updated_at = {}
        article_complete.save()
        status = compute_translation_status(article_complete, "fa")
        assert status == "complete"


# ---------------------------------------------------------------------------
# Outdated status
# ---------------------------------------------------------------------------


class TestOutdatedStatus:
    """Entity where source locale updated after target returns 'outdated'."""

    def test_fa_outdated_when_en_updated_more_recently(self, article_outdated):
        # en was updated 1h ago, fa was updated 5h ago → fa is outdated
        status = compute_translation_status(article_outdated, "fa")
        assert status == "outdated"

    def test_en_not_outdated_when_en_is_more_recent(self, article_outdated):
        # en was updated 1h ago, fa was updated 5h ago → en is NOT outdated
        status = compute_translation_status(article_outdated, "en")
        assert status == "complete"

    def test_en_outdated_when_fa_updated_more_recently(self, db):
        now = timezone.now()
        article = Article.objects.create(
            slug_fa="slug-en-outdated",
            slug_en="en-outdated",
            title_fa="عنوان فارسی جدید",
            title_en="Old English Title",
            excerpt_fa="خلاصه جدید",
            excerpt_en="Old excerpt",
            status="draft",
            locale_updated_at={
                "fa": (now - timedelta(hours=1)).isoformat(),
                "en": (now - timedelta(hours=5)).isoformat(),
            },
        )
        status = compute_translation_status(article, "en")
        assert status == "outdated"


# ---------------------------------------------------------------------------
# get_translation_status_for_entity
# ---------------------------------------------------------------------------


class TestGetTranslationStatusForEntity:
    """Test the convenience function that computes status for all locales."""

    def test_returns_dict_with_both_locales(self, article_complete):
        result = get_translation_status_for_entity(article_complete)
        assert "fa" in result
        assert "en" in result

    def test_mixed_statuses(self, article_no_target):
        result = get_translation_status_for_entity(article_no_target)
        assert result["fa"] == "missing"
        assert result["en"] == "complete"


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


class TestEdgeCases:
    """Edge cases for translation status computation."""

    def test_unsupported_locale_raises_value_error(self, article_complete):
        with pytest.raises(ValueError, match="Unsupported locale"):
            compute_translation_status(article_complete, "de")

    def test_whitespace_only_field_treated_as_empty(self, db):
        article = Article.objects.create(
            slug_fa="slug-ws",
            slug_en="ws-test",
            title_fa="   ",
            title_en="English Title",
            excerpt_fa="   ",
            excerpt_en="Excerpt",
            status="draft",
        )
        status = compute_translation_status(article, "fa")
        assert status == "missing"
