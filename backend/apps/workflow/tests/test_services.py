"""Tests for workflow state machine services.

Validates Requirements 8.1, 8.2, 8.3, 8.10:
- State machine transitions are enforced
- Disallowed transitions return TransitionError
- Permission checks gate transitions by role
- Audit events are created on every successful transition
- Published transition sets published_at and creates revision
- Scheduled transition validates scheduled_at in future
"""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, User
from django.utils import timezone

from apps.blog.models import Article
from apps.workflow.models import AuditEvent, Revision, ScheduledPublish
from apps.workflow.services import (
    ALLOWED_TRANSITIONS,
    VALID_STATES,
    PermissionDenied,
    Success,
    TransitionError,
    transition_status,
)


@pytest.fixture
def admin_user(db):
    """Create an admin (superuser) for tests."""
    return User.objects.create_superuser(
        username="admin", password="testpass", email="admin@test.com"
    )


@pytest.fixture
def editor_user(db):
    """Create an editor user (in 'editor' group)."""
    user = User.objects.create_user(
        username="editor", password="testpass", email="editor@test.com"
    )
    group, _ = Group.objects.get_or_create(name="editor")
    user.groups.add(group)
    return user


@pytest.fixture
def reviewer_user(db):
    """Create a reviewer user (in 'reviewer' group)."""
    user = User.objects.create_user(
        username="reviewer", password="testpass", email="reviewer@test.com"
    )
    group, _ = Group.objects.get_or_create(name="reviewer")
    user.groups.add(group)
    return user


@pytest.fixture
def draft_article(db):
    """Create a draft article for testing transitions."""
    return Article.objects.create(
        slug_fa="مقاله-تست",
        slug_en="test-article",
        title_fa="مقاله تست",
        title_en="Test Article",
        status="draft",
    )


# ---------------------------------------------------------------------------
# Allowed transitions
# ---------------------------------------------------------------------------


class TestAllowedTransitions:
    """Test that valid transitions succeed."""

    def test_draft_to_in_review(self, draft_article, admin_user):
        result = transition_status(draft_article, "in_review", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "in_review"

    def test_draft_to_published(self, draft_article, admin_user):
        result = transition_status(draft_article, "published", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "published"
        assert draft_article.published_at is not None

    def test_in_review_to_draft(self, draft_article, admin_user):
        draft_article.status = "in_review"
        draft_article.save()
        result = transition_status(draft_article, "draft", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "draft"

    def test_in_review_to_published(self, draft_article, admin_user):
        draft_article.status = "in_review"
        draft_article.save()
        result = transition_status(draft_article, "published", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "published"

    def test_in_review_to_scheduled(self, draft_article, admin_user):
        draft_article.status = "in_review"
        draft_article.save()
        future = timezone.now() + timedelta(hours=1)
        result = transition_status(
            draft_article, "scheduled", admin_user, scheduled_at=future
        )
        assert isinstance(result, Success)
        assert draft_article.status == "scheduled"

    def test_scheduled_to_published(self, draft_article, admin_user):
        draft_article.status = "scheduled"
        draft_article.save()
        result = transition_status(draft_article, "published", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "published"

    def test_scheduled_to_draft(self, draft_article, admin_user):
        draft_article.status = "scheduled"
        draft_article.save()
        result = transition_status(draft_article, "draft", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "draft"

    def test_published_to_archived(self, draft_article, admin_user):
        draft_article.status = "published"
        draft_article.save()
        result = transition_status(draft_article, "archived", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "archived"

    def test_published_to_draft(self, draft_article, admin_user):
        draft_article.status = "published"
        draft_article.save()
        result = transition_status(draft_article, "draft", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "draft"

    def test_archived_to_draft(self, draft_article, admin_user):
        draft_article.status = "archived"
        draft_article.save()
        result = transition_status(draft_article, "draft", admin_user)
        assert isinstance(result, Success)
        assert draft_article.status == "draft"


# ---------------------------------------------------------------------------
# Disallowed transitions
# ---------------------------------------------------------------------------


class TestDisallowedTransitions:
    """Test that invalid transitions return TransitionError."""

    def test_draft_to_archived(self, draft_article, admin_user):
        result = transition_status(draft_article, "archived", admin_user)
        assert isinstance(result, TransitionError)
        assert "Cannot transition" in result.message
        assert draft_article.status == "draft"  # unchanged

    def test_draft_to_scheduled(self, draft_article, admin_user):
        future = timezone.now() + timedelta(hours=1)
        result = transition_status(
            draft_article, "scheduled", admin_user, scheduled_at=future
        )
        assert isinstance(result, TransitionError)

    def test_published_to_in_review(self, draft_article, admin_user):
        draft_article.status = "published"
        draft_article.save()
        result = transition_status(draft_article, "in_review", admin_user)
        assert isinstance(result, TransitionError)

    def test_archived_to_published(self, draft_article, admin_user):
        draft_article.status = "archived"
        draft_article.save()
        result = transition_status(draft_article, "published", admin_user)
        assert isinstance(result, TransitionError)

    def test_invalid_current_status(self, draft_article, admin_user):
        draft_article.status = "nonexistent"
        draft_article.save()
        result = transition_status(draft_article, "draft", admin_user)
        assert isinstance(result, TransitionError)
        assert "not a valid workflow state" in result.message

    def test_invalid_target_status(self, draft_article, admin_user):
        result = transition_status(draft_article, "nonexistent", admin_user)
        assert isinstance(result, TransitionError)
        assert "not a valid workflow state" in result.message


# ---------------------------------------------------------------------------
# Permission checks
# ---------------------------------------------------------------------------


class TestPermissionChecks:
    """Test role-based permission enforcement."""

    def test_reviewer_cannot_publish(self, draft_article, reviewer_user):
        result = transition_status(draft_article, "published", reviewer_user)
        assert isinstance(result, PermissionDenied)
        assert draft_article.status == "draft"  # unchanged

    def test_reviewer_can_submit_for_review(self, draft_article, reviewer_user):
        result = transition_status(draft_article, "in_review", reviewer_user)
        assert isinstance(result, Success)
        assert draft_article.status == "in_review"

    def test_reviewer_can_send_back_to_draft(self, draft_article, reviewer_user):
        draft_article.status = "in_review"
        draft_article.save()
        result = transition_status(draft_article, "draft", reviewer_user)
        assert isinstance(result, Success)

    def test_reviewer_cannot_schedule(self, draft_article, reviewer_user):
        draft_article.status = "in_review"
        draft_article.save()
        future = timezone.now() + timedelta(hours=1)
        result = transition_status(
            draft_article, "scheduled", reviewer_user, scheduled_at=future
        )
        assert isinstance(result, PermissionDenied)

    def test_editor_can_publish(self, draft_article, editor_user):
        result = transition_status(draft_article, "published", editor_user)
        assert isinstance(result, Success)

    def test_editor_cannot_archive(self, draft_article, editor_user):
        draft_article.status = "published"
        draft_article.save()
        result = transition_status(draft_article, "archived", editor_user)
        assert isinstance(result, PermissionDenied)

    def test_admin_can_archive(self, draft_article, admin_user):
        draft_article.status = "published"
        draft_article.save()
        result = transition_status(draft_article, "archived", admin_user)
        assert isinstance(result, Success)


# ---------------------------------------------------------------------------
# Scheduling validation
# ---------------------------------------------------------------------------


class TestScheduling:
    """Test scheduling-specific validation."""

    def test_scheduled_at_required(self, draft_article, admin_user):
        draft_article.status = "in_review"
        draft_article.save()
        result = transition_status(draft_article, "scheduled", admin_user)
        assert isinstance(result, TransitionError)
        assert "scheduled_at is required" in result.message

    def test_scheduled_at_must_be_future(self, draft_article, admin_user):
        draft_article.status = "in_review"
        draft_article.save()
        past = timezone.now() - timedelta(hours=1)
        result = transition_status(
            draft_article, "scheduled", admin_user, scheduled_at=past
        )
        assert isinstance(result, TransitionError)
        assert "must be in the future" in result.message

    def test_scheduled_creates_job(self, draft_article, admin_user):
        draft_article.status = "in_review"
        draft_article.save()
        future = timezone.now() + timedelta(hours=2)
        result = transition_status(
            draft_article, "scheduled", admin_user, scheduled_at=future
        )
        assert isinstance(result, Success)
        job = ScheduledPublish.objects.get(object_id=draft_article.pk)
        assert job.scheduled_at == future
        assert job.status == "pending"


# ---------------------------------------------------------------------------
# Publish side effects
# ---------------------------------------------------------------------------


class TestPublishSideEffects:
    """Test that publishing sets published_at and creates revision."""

    def test_published_at_set(self, draft_article, admin_user):
        assert draft_article.published_at is None
        result = transition_status(draft_article, "published", admin_user)
        assert isinstance(result, Success)
        assert draft_article.published_at is not None
        # published_at should be close to now
        delta = timezone.now() - draft_article.published_at
        assert delta.total_seconds() < 5

    def test_revision_created_on_publish(self, draft_article, admin_user):
        assert Revision.objects.count() == 0
        transition_status(draft_article, "published", admin_user)
        assert Revision.objects.count() == 1
        revision = Revision.objects.first()
        assert revision.object_id == draft_article.pk
        assert "Published at" in revision.label
        assert revision.snapshot["status"] == "draft"  # snapshot before save


# ---------------------------------------------------------------------------
# Audit events
# ---------------------------------------------------------------------------


class TestAuditEvents:
    """Test that audit events are created on every transition."""

    def test_audit_event_created(self, draft_article, admin_user):
        assert AuditEvent.objects.count() == 0
        transition_status(draft_article, "in_review", admin_user)
        assert AuditEvent.objects.count() == 1
        event = AuditEvent.objects.first()
        assert event.from_status == "draft"
        assert event.to_status == "in_review"
        assert event.user == admin_user
        assert event.object_id == draft_article.pk

    def test_audit_event_with_reason(self, draft_article, admin_user):
        transition_status(
            draft_article, "in_review", admin_user, reason="Ready for review"
        )
        event = AuditEvent.objects.first()
        assert event.reason == "Ready for review"

    def test_no_audit_on_failed_transition(self, draft_article, admin_user):
        transition_status(draft_article, "archived", admin_user)  # disallowed
        assert AuditEvent.objects.count() == 0

    def test_multiple_transitions_create_multiple_events(
        self, draft_article, admin_user
    ):
        transition_status(draft_article, "in_review", admin_user)
        transition_status(draft_article, "published", admin_user)
        assert AuditEvent.objects.count() == 2
