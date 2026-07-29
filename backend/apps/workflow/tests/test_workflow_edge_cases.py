"""Comprehensive edge-case tests for the workflow module.

Covers:
1. Invalid state transitions (all disallowed paths)
2. Scheduling edge cases (past date, cancellation, retry via Celery task)
3. Preview token expiry (tokens older than 15 minutes must be rejected)
4. Translation outdated logic (source locale change → target becomes Outdated)

Validates Requirements: 15.1, 15.2, 15.3, 15.8
"""

from __future__ import annotations

import time
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.contrib.auth.models import Group, User
from django.contrib.contenttypes.models import ContentType
from django.core import signing
from django.utils import timezone

from apps.blog.models import Article
from apps.workflow.models import AuditEvent, ScheduledPublish
from apps.workflow.services import (
    ALLOWED_TRANSITIONS,
    _PREVIEW_TOKEN_MAX_AGE,
    _PREVIEW_TOKEN_SALT,
    _revoked_tokens,
    generate_preview_token,
    revoke_preview_token,
    validate_preview_token,
    PermissionDenied,
    Success,
    TransitionError,
    transition_status,
)
from apps.workflow.tasks import process_scheduled_publishes
from apps.workflow.translation import compute_translation_status


# ===========================================================================
# Fixtures
# ===========================================================================


@pytest.fixture
def admin_user(db):
    """Superuser with full permissions."""
    return User.objects.create_superuser(
        username="admin_edge",
        password="testpass",
        email="admin_edge@test.com",
    )


@pytest.fixture
def editor_user(db):
    """Editor group user."""
    user = User.objects.create_user(
        username="editor_edge",
        password="testpass",
        email="editor_edge@test.com",
    )
    group, _ = Group.objects.get_or_create(name="editor")
    user.groups.add(group)
    return user


@pytest.fixture
def reviewer_user(db):
    """Reviewer group user."""
    user = User.objects.create_user(
        username="reviewer_edge",
        password="testpass",
        email="reviewer_edge@test.com",
    )
    group, _ = Group.objects.get_or_create(name="reviewer")
    user.groups.add(group)
    return user


@pytest.fixture
def unprivileged_user(db):
    """User with no groups/permissions."""
    return User.objects.create_user(
        username="nogroup",
        password="testpass",
        email="nogroup@test.com",
    )


@pytest.fixture
def article(db):
    """A draft article for testing."""
    return Article.objects.create(
        slug_fa="مقاله-آزمایش-لبه",
        slug_en="edge-test-article",
        title_fa="مقاله آزمایش",
        title_en="Edge Test Article",
        status="draft",
    )


@pytest.fixture(autouse=True)
def clear_revocation_set():
    """Clear the preview token revocation set between tests."""
    _revoked_tokens.clear()
    yield
    _revoked_tokens.clear()


# ===========================================================================
# 1. Invalid State Transitions (comprehensive disallowed paths)
# ===========================================================================


class TestInvalidTransitions:
    """Exhaustive tests for ALL disallowed transition paths.

    The state machine allows:
      draft → in_review | published
      in_review → draft | scheduled | published
      scheduled → draft | published
      published → draft | archived
      archived → draft

    All other paths must be rejected with TransitionError.
    """

    @pytest.mark.parametrize(
        "from_status,to_status",
        [
            # From draft: cannot go to scheduled or archived
            ("draft", "scheduled"),
            ("draft", "archived"),
            # From in_review: cannot go to archived
            ("in_review", "archived"),
            # From scheduled: cannot go to in_review or archived
            ("scheduled", "in_review"),
            ("scheduled", "archived"),
            # From published: cannot go to in_review or scheduled
            ("published", "in_review"),
            ("published", "scheduled"),
            # From archived: cannot go to in_review, scheduled, or published
            ("archived", "in_review"),
            ("archived", "scheduled"),
            ("archived", "published"),
            ("archived", "archived"),
        ],
    )
    def test_disallowed_transition_returns_error(
        self, article, admin_user, from_status, to_status
    ):
        """Every disallowed transition must fail with TransitionError."""
        article.status = from_status
        article.save()

        kwargs = {}
        if to_status == "scheduled":
            kwargs["scheduled_at"] = timezone.now() + timedelta(hours=1)

        result = transition_status(article, to_status, admin_user, **kwargs)
        assert isinstance(result, TransitionError)
        assert article.status == from_status  # status unchanged

    def test_self_transition_draft_to_draft_is_disallowed(self, article, admin_user):
        """Transitioning to the same state should fail (not in allowed list)."""
        article.status = "draft"
        article.save()
        result = transition_status(article, "draft", admin_user)
        assert isinstance(result, TransitionError)

    def test_self_transition_published_to_published_is_disallowed(
        self, article, admin_user
    ):
        """Cannot re-publish an already published article."""
        article.status = "published"
        article.save()
        result = transition_status(article, "published", admin_user)
        assert isinstance(result, TransitionError)

    def test_no_audit_event_on_failed_transition(self, article, admin_user):
        """Failed transitions must not create audit events."""
        article.status = "archived"
        article.save()
        initial_count = AuditEvent.objects.count()

        transition_status(article, "published", admin_user)

        assert AuditEvent.objects.count() == initial_count

    def test_unknown_source_state_rejected(self, article, admin_user):
        """Entity with unknown status is rejected."""
        article.status = "bogus_state"
        article.save()
        result = transition_status(article, "draft", admin_user)
        assert isinstance(result, TransitionError)
        assert "not a valid workflow state" in result.message

    def test_unknown_target_state_rejected(self, article, admin_user):
        """Unknown target status is rejected."""
        result = transition_status(article, "nonexistent_state", admin_user)
        assert isinstance(result, TransitionError)
        assert "not a valid workflow state" in result.message

    def test_unprivileged_user_cannot_publish(self, article, unprivileged_user):
        """A user with no groups cannot transition to published."""
        result = transition_status(article, "published", unprivileged_user)
        assert isinstance(result, PermissionDenied)
        assert article.status == "draft"

    def test_unprivileged_user_cannot_transition_to_in_review(
        self, article, unprivileged_user
    ):
        """A user with no groups cannot transition to in_review."""
        result = transition_status(article, "in_review", unprivileged_user)
        assert isinstance(result, PermissionDenied)

    def test_reviewer_cannot_archive(self, article, reviewer_user):
        """Reviewers cannot archive content."""
        article.status = "published"
        article.save()
        result = transition_status(article, "archived", reviewer_user)
        assert isinstance(result, PermissionDenied)

    def test_editor_cannot_archive(self, article, editor_user):
        """Editors cannot archive content (only admins)."""
        article.status = "published"
        article.save()
        result = transition_status(article, "archived", editor_user)
        assert isinstance(result, PermissionDenied)


# ===========================================================================
# 2. Scheduling Edge Cases
# ===========================================================================


class TestSchedulingEdgeCases:
    """Tests for scheduling-specific validation and task processing."""

    def test_schedule_without_scheduled_at_fails(self, article, admin_user):
        """Scheduling without providing scheduled_at is an error."""
        article.status = "in_review"
        article.save()
        result = transition_status(article, "scheduled", admin_user)
        assert isinstance(result, TransitionError)
        assert "scheduled_at is required" in result.message

    def test_schedule_with_past_date_fails(self, article, admin_user):
        """Scheduling with a past date is rejected."""
        article.status = "in_review"
        article.save()
        past = timezone.now() - timedelta(days=1)
        result = transition_status(
            article, "scheduled", admin_user, scheduled_at=past
        )
        assert isinstance(result, TransitionError)
        assert "must be in the future" in result.message

    def test_schedule_with_now_fails(self, article, admin_user):
        """Scheduling with current time (not strictly future) fails."""
        article.status = "in_review"
        article.save()
        # Use a time that's very close to now (essentially now)
        almost_now = timezone.now() - timedelta(seconds=1)
        result = transition_status(
            article, "scheduled", admin_user, scheduled_at=almost_now
        )
        assert isinstance(result, TransitionError)
        assert "must be in the future" in result.message

    def test_schedule_with_non_datetime_fails(self, article, admin_user):
        """Scheduling with a non-datetime value is rejected."""
        article.status = "in_review"
        article.save()
        result = transition_status(
            article, "scheduled", admin_user, scheduled_at="not-a-datetime"
        )
        assert isinstance(result, TransitionError)
        assert "datetime" in result.message.lower()

    def test_cancellation_via_draft_transition(self, article, admin_user):
        """Cancelling a scheduled publish by transitioning back to draft."""
        article.status = "in_review"
        article.save()
        future = timezone.now() + timedelta(hours=2)
        transition_status(article, "scheduled", admin_user, scheduled_at=future)
        assert article.status == "scheduled"

        # Cancel by going back to draft
        result = transition_status(article, "draft", admin_user)
        assert isinstance(result, Success)
        assert article.status == "draft"

    def test_scheduled_job_created_with_correct_data(self, article, admin_user):
        """ScheduledPublish record is created correctly."""
        article.status = "in_review"
        article.save()
        future = timezone.now() + timedelta(hours=5)
        transition_status(article, "scheduled", admin_user, scheduled_at=future)

        job = ScheduledPublish.objects.get(object_id=article.pk)
        assert job.scheduled_at == future
        assert job.status == "pending"
        assert job.attempts == 0
        assert job.last_error == ""

    def test_process_scheduled_publishes_publishes_due_content(
        self, article, admin_user
    ):
        """Celery task publishes content whose scheduled_at has passed."""
        article.status = "in_review"
        article.save()
        # Schedule for 1 second in the future
        future = timezone.now() + timedelta(seconds=1)
        transition_status(article, "scheduled", admin_user, scheduled_at=future)
        assert article.status == "scheduled"

        # Move clock forward by patching timezone.now
        past_due = future + timedelta(seconds=1)
        with patch("apps.workflow.tasks.timezone.now", return_value=past_due):
            result = process_scheduled_publishes()

        assert result["completed"] == 1
        article.refresh_from_db()
        assert article.status == "published"

    def test_process_scheduled_publishes_ignores_future_jobs(
        self, article, admin_user
    ):
        """Celery task does not publish content whose time hasn't arrived."""
        article.status = "in_review"
        article.save()
        far_future = timezone.now() + timedelta(days=30)
        transition_status(article, "scheduled", admin_user, scheduled_at=far_future)

        result = process_scheduled_publishes()
        assert result["completed"] == 0
        article.refresh_from_db()
        assert article.status == "scheduled"

    def test_process_scheduled_publishes_retry_on_failure(self, article, admin_user):
        """Task retries on failure, marking as failed after max attempts."""
        article.status = "in_review"
        article.save()
        past_due = timezone.now() - timedelta(seconds=10)

        # Directly create a ScheduledPublish to simulate scheduled content
        ct = ContentType.objects.get_for_model(article)
        job = ScheduledPublish.objects.create(
            content_type=ct,
            object_id=article.pk,
            scheduled_at=past_due,
            status="pending",
        )

        # Delete the article to cause a failure
        article_pk = article.pk
        article.delete()

        # Run task - should fail but not mark as failed yet (attempt 1)
        result = process_scheduled_publishes()
        job.refresh_from_db()
        assert job.attempts == 1
        assert job.status == "pending"
        assert job.last_error != ""

        # Run again (attempt 2)
        process_scheduled_publishes()
        job.refresh_from_db()
        assert job.attempts == 2
        assert job.status == "pending"

        # Run again (attempt 3) - should now be marked as failed
        process_scheduled_publishes()
        job.refresh_from_db()
        assert job.attempts == 3
        assert job.status == "failed"

    def test_process_scheduled_publishes_idempotent(self, article, admin_user):
        """Completed jobs are not re-processed."""
        article.status = "in_review"
        article.save()
        past_due = timezone.now() - timedelta(seconds=10)

        ct = ContentType.objects.get_for_model(article)
        ScheduledPublish.objects.create(
            content_type=ct,
            object_id=article.pk,
            scheduled_at=past_due,
            status="completed",  # Already completed
        )

        result = process_scheduled_publishes()
        assert result["completed"] == 0
        assert result["failed"] == 0


# ===========================================================================
# 3. Preview Token Expiry
# ===========================================================================


class TestPreviewTokenExpiry:
    """Tests for preview token expiry (15 minutes), revocation, and edge cases."""

    def test_token_max_age_constant_is_15_minutes(self):
        """Verify the constant is exactly 900 seconds."""
        assert _PREVIEW_TOKEN_MAX_AGE == 900

    def test_valid_token_passes_within_15_minutes(self, article):
        """A freshly generated token should validate."""
        token = generate_preview_token(article, "fa")
        # Validate using the preview module's validate function
        from apps.workflow.preview import validate_preview_token as pv_validate

        assert pv_validate(token, article, "fa") is True

    def test_expired_token_rejected(self, article):
        """Token should be rejected after 15 minutes.

        We verify this by trying to unsign with max_age=0.
        """
        token = generate_preview_token(article, "fa")

        # Directly verify with Django signing that expiry works
        with pytest.raises(signing.SignatureExpired):
            signing.loads(token, salt=_PREVIEW_TOKEN_SALT, max_age=0)

    def test_expired_token_via_patched_time(self, article):
        """Simulate token expiry by patching the validation max_age."""
        token = generate_preview_token(article, "fa")

        # Patch the max_age to 0 to simulate expiry
        with patch("apps.workflow.preview._PREVIEW_TOKEN_MAX_AGE", 0):
            # The preview module's validate checks the services module's max_age
            # so we also patch there
            with patch("apps.workflow.services._PREVIEW_TOKEN_MAX_AGE", 0):
                result = validate_preview_token(token)
                assert result is None

    def test_revoked_token_rejected_immediately(self, article):
        """A revoked token should be rejected even if not expired."""
        token = generate_preview_token(article, "fa")
        revoke_preview_token(token)

        result = validate_preview_token(token)
        assert result is None

    def test_revoked_token_rejected_via_preview_module(self, article):
        """Test revocation through the preview module interface."""
        from apps.workflow.preview import validate_preview_token as pv_validate

        token = generate_preview_token(article, "fa")
        revoke_preview_token(token)
        assert pv_validate(token, article, "fa") is False

    def test_tampered_token_rejected(self, article):
        """Modifying any part of the token invalidates it."""
        token = generate_preview_token(article, "fa")
        tampered = token[:-1] + ("a" if token[-1] != "a" else "b")
        result = validate_preview_token(tampered)
        assert result is None

    def test_completely_invalid_token_rejected(self, article):
        """Random gibberish is rejected."""
        result = validate_preview_token("completely-random-gibberish-not-a-token")
        assert result is None

    def test_empty_token_rejected(self, article):
        """Empty string is rejected."""
        result = validate_preview_token("")
        assert result is None

    def test_token_for_deleted_entity_rejected(self, article):
        """Token for a deleted entity returns None."""
        token = generate_preview_token(article, "fa")
        article.delete()

        result = validate_preview_token(token)
        assert result is None

    def test_token_locale_mismatch_via_preview_module(self, article):
        """Token generated for 'fa' cannot validate for 'en'."""
        from apps.workflow.preview import validate_preview_token as pv_validate

        token = generate_preview_token(article, "fa")
        assert pv_validate(token, article, "en") is False

    def test_token_entity_mismatch(self, db):
        """Token for one article cannot validate for another."""
        from apps.workflow.preview import validate_preview_token as pv_validate

        article1 = Article.objects.create(
            slug_fa="مقاله-۱-پیشنمایش",
            slug_en="preview-article-1",
            title_fa="مقاله ۱",
            title_en="Article 1",
            status="draft",
        )
        article2 = Article.objects.create(
            slug_fa="مقاله-۲-پیشنمایش",
            slug_en="preview-article-2",
            title_fa="مقاله ۲",
            title_en="Article 2",
            status="draft",
        )

        token = generate_preview_token(article1, "fa")
        assert pv_validate(token, article1, "fa") is True
        assert pv_validate(token, article2, "fa") is False


# ===========================================================================
# 4. Translation Outdated Logic
# ===========================================================================


class TestTranslationOutdatedLogic:
    """Tests for translation status computation, especially Outdated detection.

    When the source locale is updated after the target locale, the target
    locale should be reported as "outdated".
    """

    def test_complete_when_all_fields_filled(self, db):
        """All fields filled and no timestamp info → complete."""
        article = Article.objects.create(
            slug_fa="ترجمه-تست",
            slug_en="translation-test",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="English Excerpt",
            status="draft",
        )
        assert compute_translation_status(article, "fa") == "complete"
        assert compute_translation_status(article, "en") == "complete"

    def test_missing_when_all_target_fields_empty(self, db):
        """All target locale fields empty → missing."""
        article = Article.objects.create(
            slug_fa="ترجمه-ناقص",
            slug_en="missing-translation",
            title_fa="",
            title_en="English Title",
            excerpt_fa="",
            excerpt_en="English Excerpt",
            status="draft",
        )
        assert compute_translation_status(article, "fa") == "missing"

    def test_incomplete_when_some_target_fields_empty(self, db):
        """Some target locale fields filled, some empty → incomplete."""
        article = Article.objects.create(
            slug_fa="ترجمه-ناکامل",
            slug_en="incomplete-translation",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="",  # This is empty
            excerpt_en="English Excerpt",
            status="draft",
        )
        assert compute_translation_status(article, "fa") == "incomplete"

    def test_outdated_when_source_updated_after_target(self, db):
        """Source locale updated after target locale → outdated."""
        now = timezone.now()
        article = Article.objects.create(
            slug_fa="ترجمه-قدیمی",
            slug_en="outdated-translation",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="English Excerpt",
            status="draft",
            locale_updated_at={
                "en": (now - timedelta(hours=1)).isoformat(),  # source: 1h ago
                "fa": (now - timedelta(hours=2)).isoformat(),  # target: 2h ago (older)
            },
        )
        # FA is the target. EN (source) was updated more recently → outdated
        assert compute_translation_status(article, "fa") == "outdated"

    def test_not_outdated_when_target_updated_after_source(self, db):
        """Target locale updated after source locale → complete (not outdated)."""
        now = timezone.now()
        article = Article.objects.create(
            slug_fa="ترجمه-بروز",
            slug_en="fresh-translation",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="English Excerpt",
            status="draft",
            locale_updated_at={
                "en": (now - timedelta(hours=2)).isoformat(),  # source: 2h ago
                "fa": (now - timedelta(hours=1)).isoformat(),  # target: 1h ago (newer)
            },
        )
        assert compute_translation_status(article, "fa") == "complete"

    def test_outdated_en_when_fa_source_updated(self, db):
        """English becomes outdated when Persian (source for en) is updated."""
        now = timezone.now()
        article = Article.objects.create(
            slug_fa="ترجمه-انگلیسی-قدیمی",
            slug_en="en-outdated",
            title_fa="عنوان فارسی جدید",
            title_en="Old English Title",
            excerpt_fa="خلاصه فارسی جدید",
            excerpt_en="Old English Excerpt",
            status="draft",
            locale_updated_at={
                "fa": (now - timedelta(minutes=30)).isoformat(),  # source: 30m ago
                "en": (now - timedelta(hours=3)).isoformat(),  # target: 3h ago
            },
        )
        assert compute_translation_status(article, "en") == "outdated"

    def test_complete_when_no_locale_timestamps(self, db):
        """Without locale_updated_at, defaults to complete if all fields filled."""
        article = Article.objects.create(
            slug_fa="ترجمه-بدون-تایمستمپ",
            slug_en="no-timestamps",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="English Excerpt",
            status="draft",
            locale_updated_at={},  # Empty timestamps
        )
        assert compute_translation_status(article, "fa") == "complete"
        assert compute_translation_status(article, "en") == "complete"

    def test_complete_when_only_target_timestamp_exists(self, db):
        """If only target timestamp exists (no source timestamp), → complete."""
        now = timezone.now()
        article = Article.objects.create(
            slug_fa="ترجمه-تنها-هدف",
            slug_en="only-target-timestamp",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="English Excerpt",
            status="draft",
            locale_updated_at={
                "fa": now.isoformat(),
                # "en" is missing
            },
        )
        assert compute_translation_status(article, "fa") == "complete"

    def test_complete_when_only_source_timestamp_exists(self, db):
        """If only source timestamp exists (no target timestamp), → complete.

        Without target timestamp, we can't determine if it's outdated.
        """
        now = timezone.now()
        article = Article.objects.create(
            slug_fa="ترجمه-تنها-منبع",
            slug_en="only-source-timestamp",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="English Excerpt",
            status="draft",
            locale_updated_at={
                "en": now.isoformat(),
                # "fa" is missing - no target timestamp
            },
        )
        # FA target doesn't have a timestamp, so no outdated determination possible
        assert compute_translation_status(article, "fa") == "complete"

    def test_invalid_locale_raises_value_error(self, article):
        """Unsupported locale raises ValueError."""
        with pytest.raises(ValueError, match="Unsupported locale"):
            compute_translation_status(article, "de")

    def test_whitespace_only_fields_are_considered_empty(self, db):
        """Fields containing only whitespace are treated as empty."""
        article = Article.objects.create(
            slug_fa="ترجمه-فضای-خالی",
            slug_en="whitespace-test",
            title_fa="   ",  # whitespace only
            title_en="English Title",
            excerpt_fa="  \t\n  ",  # whitespace only
            excerpt_en="English Excerpt",
            status="draft",
        )
        assert compute_translation_status(article, "fa") == "missing"

    def test_outdated_detection_with_equal_timestamps(self, db):
        """Equal timestamps (source == target) should NOT be outdated."""
        now = timezone.now()
        timestamp = now.isoformat()
        article = Article.objects.create(
            slug_fa="ترجمه-برابر",
            slug_en="equal-timestamps",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="English Excerpt",
            status="draft",
            locale_updated_at={
                "en": timestamp,
                "fa": timestamp,
            },
        )
        # Equal timestamps means NOT outdated (source > target is strict)
        assert compute_translation_status(article, "fa") == "complete"
        assert compute_translation_status(article, "en") == "complete"

    def test_none_fields_are_considered_empty(self, db):
        """None values in locale fields are treated as empty."""
        article = Article.objects.create(
            slug_fa="ترجمه-نال",
            slug_en="none-fields",
            title_fa="عنوان فارسی",
            title_en="English Title",
            excerpt_fa="خلاصه فارسی",
            excerpt_en="English Excerpt",
            status="draft",
        )
        # CharField is NOT NULL in the database, but the computation must
        # still treat an in-memory None from an integration boundary as empty.
        article.title_en = None

        status = compute_translation_status(article, "en")
        # title_en is None → at least some fields empty
        assert status in ("incomplete", "missing")
