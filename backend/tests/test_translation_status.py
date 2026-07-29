"""Tests for translation freshness computation.

Validates Requirements 15.1, 15.8:
- Returns "missing" when all target locale fields are empty
- Returns "incomplete" when some fields are filled
- Returns "complete" when all fields are filled
- Returns "outdated" when source locale updated after target locale
- Works with Page, Article, and CaseStudy models

Note: These tests assume a service function from task 6.7 exists:
- compute_translation_status(entity, target_locale) -> str
"""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.blog.models import Article
from apps.cms.models import Page
from apps.portfolio.models import CaseStudy

# Import the translation status service function.
# This is expected to be implemented in task 6.7.
from apps.workflow.translation import compute_translation_status


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def page_missing_fa(db):
    """Page with no Persian content (target=fa → missing)."""
    return Page.objects.create(
        slug_fa="",  # SlugField can't truly be empty with unique, use placeholder
        slug_en="english-page",
        title_fa="",
        title_en="English Page",
        page_type="custom",
        status="draft",
    )


@pytest.fixture
def page_complete(db):
    """Page with both locales fully filled."""
    return Page.objects.create(
        slug_fa="صفحه-کامل",
        slug_en="complete-page",
        title_fa="صفحه کامل",
        title_en="Complete Page",
        page_type="custom",
        status="draft",
    )


@pytest.fixture
def article_missing_en(db):
    """Article with no English content (target=en → missing)."""
    return Article.objects.create(
        slug_fa="مقاله-فارسی",
        slug_en="farsi-article-placeholder",
        title_fa="مقاله فارسی",
        title_en="",
        excerpt_fa="خلاصه فارسی",
        excerpt_en="",
        status="draft",
    )


@pytest.fixture
def article_incomplete_en(db):
    """Article with some English fields filled (target=en → incomplete)."""
    return Article.objects.create(
        slug_fa="مقاله-ناقص",
        slug_en="incomplete-article",
        title_fa="مقاله ناقص",
        title_en="Incomplete Article",
        excerpt_fa="خلاصه فارسی",
        excerpt_en="",  # missing excerpt
        status="draft",
    )


@pytest.fixture
def article_complete(db):
    """Article with all locale fields filled."""
    return Article.objects.create(
        slug_fa="مقاله-کامل",
        slug_en="complete-article",
        title_fa="مقاله کامل",
        title_en="Complete Article",
        excerpt_fa="خلاصه فارسی",
        excerpt_en="English excerpt",
        status="draft",
    )


@pytest.fixture
def case_study_missing_fa(db):
    """CaseStudy with no Persian content (target=fa → missing)."""
    return CaseStudy.objects.create(
        slug_fa="نمونه-کار-خالی",
        slug_en="empty-case-study",
        title_fa="",
        title_en="Case Study",
        role_fa="",
        role_en="Developer",
        outcome_fa="",
        outcome_en="Great results",
        status="draft",
    )


@pytest.fixture
def case_study_complete(db):
    """CaseStudy with all locale fields filled."""
    return CaseStudy.objects.create(
        slug_fa="نمونه-کار-کامل",
        slug_en="complete-case-study",
        title_fa="نمونه کار کامل",
        title_en="Complete Case Study",
        role_fa="توسعه‌دهنده",
        role_en="Developer",
        outcome_fa="نتایج عالی",
        outcome_en="Great results",
        client_fa="مشتری",
        client_en="Client",
        status="draft",
    )


# ---------------------------------------------------------------------------
# "missing" status
# ---------------------------------------------------------------------------


class TestTranslationMissing:
    """Test returns 'missing' when all target locale fields are empty."""

    def test_page_missing_fa(self, page_missing_fa):
        """Page with empty fa fields returns 'missing' for target=fa."""
        status = compute_translation_status(page_missing_fa, "fa")
        assert status == "missing"

    def test_article_missing_en(self, article_missing_en):
        """Article with empty en fields returns 'missing' for target=en."""
        status = compute_translation_status(article_missing_en, "en")
        assert status == "missing"

    def test_case_study_missing_fa(self, case_study_missing_fa):
        """CaseStudy with empty fa fields returns 'missing' for target=fa."""
        status = compute_translation_status(case_study_missing_fa, "fa")
        assert status == "missing"


# ---------------------------------------------------------------------------
# "incomplete" status
# ---------------------------------------------------------------------------


class TestTranslationIncomplete:
    """Test returns 'incomplete' when some target fields are filled."""

    def test_article_incomplete_en(self, article_incomplete_en):
        """Article with some en fields filled returns 'incomplete'."""
        status = compute_translation_status(article_incomplete_en, "en")
        assert status == "incomplete"


# ---------------------------------------------------------------------------
# "complete" status
# ---------------------------------------------------------------------------


class TestTranslationComplete:
    """Test returns 'complete' when all target fields are filled."""

    def test_page_complete_fa(self, page_complete):
        """Page with all fa fields filled returns 'complete' for target=fa."""
        status = compute_translation_status(page_complete, "fa")
        assert status == "complete"

    def test_page_complete_en(self, page_complete):
        """Page with all en fields filled returns 'complete' for target=en."""
        status = compute_translation_status(page_complete, "en")
        assert status == "complete"

    def test_article_complete_en(self, article_complete):
        """Article with all en fields filled returns 'complete'."""
        status = compute_translation_status(article_complete, "en")
        assert status == "complete"

    def test_case_study_complete_fa(self, case_study_complete):
        """CaseStudy with all fa fields filled returns 'complete'."""
        status = compute_translation_status(case_study_complete, "fa")
        assert status == "complete"


# ---------------------------------------------------------------------------
# "outdated" status
# ---------------------------------------------------------------------------


class TestTranslationOutdated:
    """Test returns 'outdated' when source locale updated after target."""

    def test_page_outdated_when_source_updated_after_target(self, page_complete):
        """If source (en) updated_at > target (fa) last edit → 'outdated'."""
        # Simulate: target locale (fa) was last edited earlier,
        # then source locale (en) was edited more recently.
        # We need to mock the locale-specific edit timestamps.
        # The implementation should track per-locale edit times.
        # For now, we test via the updated_at field approach.

        # Force the entity's source locale to appear updated after target
        # This depends on implementation details of compute_translation_status.
        # The design doc says: "outdated" if source_last_edit > target_last_edit.
        # We'll mock the helper that gets locale-specific edit times.
        from unittest.mock import patch

        source_time = timezone.now()
        target_time = source_time - timedelta(hours=2)

        with patch(
            "apps.workflow.translation.get_locale_last_edit"
        ) as mock_get_edit:
            # source=en was edited at source_time, target=fa at target_time
            def side_effect(entity, locale):
                if locale == "en":
                    return source_time
                return target_time

            mock_get_edit.side_effect = side_effect

            status = compute_translation_status(page_complete, "fa")
            assert status == "outdated"

    def test_article_outdated(self, article_complete):
        """Article returns 'outdated' when source updated after target."""
        from unittest.mock import patch

        source_time = timezone.now()
        target_time = source_time - timedelta(days=1)

        with patch(
            "apps.workflow.translation.get_locale_last_edit"
        ) as mock_get_edit:
            def side_effect(entity, locale):
                if locale == "fa":  # source for target=en
                    return source_time
                return target_time

            mock_get_edit.side_effect = side_effect

            status = compute_translation_status(article_complete, "en")
            assert status == "outdated"


# ---------------------------------------------------------------------------
# Works with all model types
# ---------------------------------------------------------------------------


class TestTranslationStatusMultiModel:
    """Test that compute_translation_status works with Page, Article, CaseStudy."""

    def test_works_with_page(self, page_complete):
        """compute_translation_status accepts Page model."""
        status = compute_translation_status(page_complete, "en")
        assert status in ("missing", "incomplete", "complete", "outdated")

    def test_works_with_article(self, article_complete):
        """compute_translation_status accepts Article model."""
        status = compute_translation_status(article_complete, "fa")
        assert status in ("missing", "incomplete", "complete", "outdated")

    def test_works_with_case_study(self, case_study_complete):
        """compute_translation_status accepts CaseStudy model."""
        status = compute_translation_status(case_study_complete, "en")
        assert status in ("missing", "incomplete", "complete", "outdated")
