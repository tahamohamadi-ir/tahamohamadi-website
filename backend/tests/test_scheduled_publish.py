"""Tests for the process_scheduled_publishes Celery task.

Validates:
- Pending jobs with scheduled_at <= now are processed (published)
- Completed jobs are not re-processed (idempotency)
- Failed jobs are retried up to MAX_ATTEMPTS then marked as "failed"
- Future-scheduled jobs are not processed
- Timezone-aware comparisons work correctly
"""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from apps.cms.models import Page
from apps.workflow.models import ScheduledPublish
from apps.workflow.tasks import MAX_ATTEMPTS, process_scheduled_publishes


@pytest.fixture
def draft_page(db):
    """Create a draft page that can be published."""
    return Page.objects.create(
        slug_fa="تست-انتشار",
        slug_en="test-publish",
        title_fa="صفحه تست",
        title_en="Test Page",
        page_type="custom",
        status="draft",
    )


@pytest.fixture
def page_content_type(db):
    """Get the ContentType for the Page model."""
    return ContentType.objects.get_for_model(Page)


class TestProcessScheduledPublishes:
    """Tests for the periodic task that processes scheduled publishes."""

    def test_publishes_pending_job_past_due(self, draft_page, page_content_type):
        """A pending job with scheduled_at in the past is published."""
        job = ScheduledPublish.objects.create(
            content_type=page_content_type,
            object_id=draft_page.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="pending",
        )

        result = process_scheduled_publishes()

        assert result == {"completed": 1, "failed": 0}

        job.refresh_from_db()
        assert job.status == "completed"

        draft_page.refresh_from_db()
        assert draft_page.status == "published"
        assert draft_page.published_at is not None

    def test_does_not_process_future_jobs(self, draft_page, page_content_type):
        """A pending job with scheduled_at in the future is not processed."""
        ScheduledPublish.objects.create(
            content_type=page_content_type,
            object_id=draft_page.pk,
            scheduled_at=timezone.now() + timedelta(hours=1),
            status="pending",
        )

        result = process_scheduled_publishes()

        assert result == {"completed": 0, "failed": 0}

        draft_page.refresh_from_db()
        assert draft_page.status == "draft"

    def test_does_not_reprocess_completed_jobs(self, draft_page, page_content_type):
        """A completed job is never re-processed (idempotent)."""
        ScheduledPublish.objects.create(
            content_type=page_content_type,
            object_id=draft_page.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="completed",
        )

        result = process_scheduled_publishes()

        assert result == {"completed": 0, "failed": 0}

        draft_page.refresh_from_db()
        assert draft_page.status == "draft"

    def test_does_not_reprocess_failed_jobs(self, draft_page, page_content_type):
        """A failed job is never re-processed."""
        ScheduledPublish.objects.create(
            content_type=page_content_type,
            object_id=draft_page.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="failed",
            attempts=MAX_ATTEMPTS,
        )

        result = process_scheduled_publishes()

        assert result == {"completed": 0, "failed": 0}

    def test_increments_attempts_on_failure(self, draft_page, page_content_type):
        """On failure, attempts is incremented and last_error is recorded."""
        job = ScheduledPublish.objects.create(
            content_type=page_content_type,
            object_id=draft_page.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="pending",
            attempts=0,
        )

        with patch(
            "apps.workflow.tasks._publish_entity",
            side_effect=RuntimeError("connection error"),
        ):
            result = process_scheduled_publishes()

        assert result == {"completed": 0, "failed": 0}

        job.refresh_from_db()
        assert job.attempts == 1
        assert job.status == "pending"  # still pending, retry allowed
        assert "connection error" in job.last_error

    def test_marks_failed_after_max_attempts(self, draft_page, page_content_type):
        """After MAX_ATTEMPTS failures the job is marked as 'failed'."""
        job = ScheduledPublish.objects.create(
            content_type=page_content_type,
            object_id=draft_page.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="pending",
            attempts=MAX_ATTEMPTS - 1,  # next failure will hit the limit
        )

        with patch(
            "apps.workflow.tasks._publish_entity",
            side_effect=RuntimeError("persistent error"),
        ):
            result = process_scheduled_publishes()

        assert result == {"completed": 0, "failed": 1}

        job.refresh_from_db()
        assert job.attempts == MAX_ATTEMPTS
        assert job.status == "failed"
        assert "persistent error" in job.last_error

    def test_idempotent_already_published_entity(self, draft_page, page_content_type):
        """If the entity is already published, the task succeeds without error."""
        draft_page.status = "published"
        draft_page.published_at = timezone.now()
        draft_page.save()

        job = ScheduledPublish.objects.create(
            content_type=page_content_type,
            object_id=draft_page.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="pending",
        )

        result = process_scheduled_publishes()

        assert result == {"completed": 1, "failed": 0}

        job.refresh_from_db()
        assert job.status == "completed"

    def test_multiple_jobs_processed_in_one_run(self, page_content_type, db):
        """Multiple pending jobs are processed in a single run."""
        pages = []
        for i in range(3):
            page = Page.objects.create(
                slug_fa=f"صفحه-{i}",
                slug_en=f"page-{i}",
                title_fa=f"صفحه {i}",
                title_en=f"Page {i}",
                page_type="custom",
                status="draft",
            )
            pages.append(page)
            ScheduledPublish.objects.create(
                content_type=page_content_type,
                object_id=page.pk,
                scheduled_at=timezone.now() - timedelta(minutes=i + 1),
                status="pending",
            )

        result = process_scheduled_publishes()

        assert result == {"completed": 3, "failed": 0}

        for page in pages:
            page.refresh_from_db()
            assert page.status == "published"
