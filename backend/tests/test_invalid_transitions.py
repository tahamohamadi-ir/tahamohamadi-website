"""Tests for invalid state machine transitions.

Validates Requirements 15.1, 15.2:
- State machine correctly rejects disallowed transitions
- No side effects (no audit event, no status change) on failed transitions
- Invalid current state and invalid target state handled gracefully
"""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.utils import timezone

from apps.blog.models import Article
from apps.cms.models import Page
from apps.workflow.models import AuditEvent, Revision, ScheduledPublish
from apps.workflow.services import (
    ALLOWED_TRANSITIONS,
    VALID_STATES,
    TransitionError,
    transition_status,
)


@pytest.fixture
def admin_user(db):
    """Create an admin (superuser) for tests."""
    return User.objects.create_superuser(
        username="admin_trans", password="testpass", email="admin_trans@test.com"
    )


@pytest.fixture
def draft_article(db):
    """Create a draft article for testing transitions."""
    return Article.objects.create(
        slug_fa="مقاله-انتقال",
        slug_en="transition-article",
        title_fa="مقاله انتقال",
        title_en="Transition Article",
        status="draft",
    )


@pytest.fixture
def draft_page(db):
    """Create a draft page for testing transitions."""
    return Page.objects.create(
        slug_fa="صفحه-انتقال",
        slug_en="transition-page",
        title_fa="صفحه انتقال",
        title_en="Transition Page",
        page_type="custom",
        status="draft",
    )


# ---------------------------------------------------------------------------
# Disallowed transitions — exhaustive coverage
# ---------------------------------------------------------------------------


class TestDisallowedTransitions:
    """Test that all disallowed transitions are rejected with TransitionError."""

    @pytest.mark.parametrize(
        "current_status,target_status",
        [
            # draft → only in_review and published are allowed
            ("draft", "archived"),
            ("draft", "scheduled"),
            # in_review → draft, scheduled, published allowed. NOT archived.
            ("in_review", "archived"),
            # scheduled → draft, published allowed. NOT in_review, archived.
            ("scheduled", "in_review"),
            ("scheduled", "archived"),
            # published → draft, archived allowed. NOT in_review, scheduled.
            ("published", "in_review"),
            ("published", "scheduled"),
            # archived → only draft allowed. NOT anything else.
            ("archived", "published"),
            ("archived", "in_review"),
            ("archived", "scheduled"),
        ],
    )
    def test_disallowed_transition_returns_error(
        self, draft_article, admin_user, current_status, target_status
    ):
        """Each disallowed (current, target) pair should return TransitionError."""
        draft_article.status = current_status
        draft_article.save()

        kwargs = {}
        if target_status == "scheduled":
            kwargs["scheduled_at"] = timezone.now() + timedelta(hours=1)

        result = transition_status(
            draft_article, target_status, admin_user, **kwargs
        )

        assert isinstance(result, TransitionError)
        assert "Cannot transition" in result.message

    @pytest.mark.parametrize(
        "current_status,target_status",
        [
            ("draft", "archived"),
            ("published", "in_review"),
            ("archived", "published"),
        ],
    )
    def test_status_unchanged_after_disallowed_transition(
        self, draft_article, admin_user, current_status, target_status
    ):
        """Entity status must not change when transition is rejected."""
        draft_article.status = current_status
        draft_article.save()

        kwargs = {}
        if target_status == "scheduled":
            kwargs["scheduled_at"] = timezone.now() + timedelta(hours=1)

        transition_status(draft_article, target_status, admin_user, **kwargs)

        draft_article.refresh_from_db()
        assert draft_article.status == current_status


# ---------------------------------------------------------------------------
# No side effects on failure
# ---------------------------------------------------------------------------


class TestNoSideEffectsOnFailure:
    """Verify that failed transitions do not create audit events or revisions."""

    def test_no_audit_event_on_disallowed_transition(
        self, draft_article, admin_user
    ):
        """Disallowed transitions must not generate audit events."""
        initial_count = AuditEvent.objects.count()

        # draft → archived is not allowed
        transition_status(draft_article, "archived", admin_user)

        assert AuditEvent.objects.count() == initial_count

    def test_no_revision_on_disallowed_transition(
        self, draft_article, admin_user
    ):
        """Disallowed transitions must not create revisions."""
        initial_count = Revision.objects.count()

        # draft → archived is not allowed
        transition_status(draft_article, "archived", admin_user)

        assert Revision.objects.count() == initial_count

    def test_no_scheduled_publish_on_disallowed_transition(
        self, draft_article, admin_user
    ):
        """If scheduled transition is disallowed, no ScheduledPublish is created."""
        initial_count = ScheduledPublish.objects.count()
        future = timezone.now() + timedelta(hours=2)

        # draft → scheduled is not allowed (only from in_review)
        transition_status(
            draft_article, "scheduled", admin_user, scheduled_at=future
        )

        assert ScheduledPublish.objects.count() == initial_count

    def test_no_published_at_on_disallowed_publish(
        self, draft_article, admin_user
    ):
        """published_at must not be set when publish transition is rejected."""
        draft_article.status = "archived"
        draft_article.save()
        assert draft_article.published_at is None

        # archived → published is not allowed
        transition_status(draft_article, "published", admin_user)

        draft_article.refresh_from_db()
        assert draft_article.published_at is None


# ---------------------------------------------------------------------------
# Invalid current state and invalid target state
# ---------------------------------------------------------------------------


class TestInvalidStates:
    """Test handling of unknown/invalid states."""

    def test_invalid_current_status(self, draft_article, admin_user):
        """Unknown current status returns TransitionError."""
        draft_article.status = "nonexistent_state"
        draft_article.save()

        result = transition_status(draft_article, "draft", admin_user)

        assert isinstance(result, TransitionError)
        assert "not a valid workflow state" in result.message

    def test_invalid_target_status(self, draft_article, admin_user):
        """Unknown target status returns TransitionError."""
        result = transition_status(draft_article, "unknown_target", admin_user)

        assert isinstance(result, TransitionError)
        assert "not a valid workflow state" in result.message

    def test_empty_string_current_status(self, draft_article, admin_user):
        """Empty string as current status is rejected."""
        draft_article.status = ""
        draft_article.save()

        result = transition_status(draft_article, "draft", admin_user)

        assert isinstance(result, TransitionError)

    def test_empty_string_target_status(self, draft_article, admin_user):
        """Empty string as target status is rejected."""
        result = transition_status(draft_article, "", admin_user)

        assert isinstance(result, TransitionError)

    def test_no_audit_event_for_invalid_current_state(
        self, draft_article, admin_user
    ):
        """No audit event is created when current state is invalid."""
        draft_article.status = "bogus"
        draft_article.save()
        initial_count = AuditEvent.objects.count()

        transition_status(draft_article, "draft", admin_user)

        assert AuditEvent.objects.count() == initial_count

    def test_no_audit_event_for_invalid_target_state(
        self, draft_article, admin_user
    ):
        """No audit event is created when target state is invalid."""
        initial_count = AuditEvent.objects.count()

        transition_status(draft_article, "bogus_target", admin_user)

        assert AuditEvent.objects.count() == initial_count

    def test_works_with_page_model(self, draft_page, admin_user):
        """Invalid transition also works correctly with Page model."""
        result = transition_status(draft_page, "archived", admin_user)

        assert isinstance(result, TransitionError)
        draft_page.refresh_from_db()
        assert draft_page.status == "draft"
