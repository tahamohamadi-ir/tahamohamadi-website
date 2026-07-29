"""Tests for scheduled publish task processing.

Validates Requirements 15.1, 15.2, 15.3, 15.8:
- Task processes pending jobs whose scheduled_at has arrived
- Task marks as failed after max attempts (3)
- Task is idempotent (doesn't re-publish completed jobs)
"""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from apps.blog.models import Article
from apps.workflow.models import ScheduledPublish
from apps.workflow.tasks import MAX_ATTEMPTS, process_scheduled_publishes


@pytest.fixture
def article(db):
    """Create a scheduled article ready for publishing."""
    return Article.objects.create(
        slug_fa="مقاله-زمانبندی",
        slug_en="scheduled-article",
        title_fa="مقاله زمان‌بندی شده",
        title_en="Scheduled Article",
        status="scheduled",
    )


@pytest.fixture
def article_content_type(db):
    """Get the ContentType for Article."""
    return ContentType.objects.get_for_model(Article)


@pytest.fixture
def pending_job(article, article_content_type):
    """Create a pending ScheduledPublish job whose time has arrived."""
    return ScheduledPublish.objects.create(
        content_type=article_content_type,
        object_id=article.pk,
        scheduled_at=timezone.now() - timedelta(minutes=5),
        status="pending",
    )


@pytest.fixture
def future_job(article, article_content_type):
    """Create a pending ScheduledPublish job whose time has NOT arrived."""
    return ScheduledPublish.objects.create(
        content_type=article_content_type,
        object_id=article.pk,
        scheduled_at=timezone.now() + timedelta(hours=2),
        status="pending",
    )


# ---------------------------------------------------------------------------
# Processing pending jobs
# ---------------------------------------------------------------------------


class TestProcessPendingJobs:
    """Task processes pending jobs whose time has arrived."""

    @pytest.mark.django_db(transaction=True)
    def test_publishes_entity_when_time_arrived(self, article, pending_job):
        result = process_scheduled_publishes()
        article.refresh_from_db()
        assert article.status == "published"
        assert article.published_at is not None
        assert result["completed"] == 1

    @pytest.mark.django_db(transaction=True)
    def test_marks_job_as_completed(self, article, pending_job):
        process_scheduled_publishes()
        pending_job.refresh_from_db()
        assert pending_job.status == "completed"

    @pytest.mark.django_db(transaction=True)
    def test_does_not_process_future_jobs(self, article, future_job):
        result = process_scheduled_publishes()
        article.refresh_from_db()
        assert article.status == "scheduled"
        future_job.refresh_from_db()
        assert future_job.status == "pending"
        assert result["completed"] == 0

    @pytest.mark.django_db(transaction=True)
    def test_processes_multiple_jobs(self, db, article_content_type):
        articles = []
        jobs = []
        for i in range(3):
            art = Article.objects.create(
                slug_fa=f"مقاله-{i}",
                slug_en=f"multi-article-{i}",
                title_fa=f"مقاله {i}",
                title_en=f"Article {i}",
                status="scheduled",
            )
            articles.append(art)
            jobs.append(
                ScheduledPublish.objects.create(
                    content_type=article_content_type,
                    object_id=art.pk,
                    scheduled_at=timezone.now() - timedelta(minutes=1),
                    status="pending",
                )
            )

        result = process_scheduled_publishes()
        assert result["completed"] == 3
        for art in articles:
            art.refresh_from_db()
            assert art.status == "published"


# ---------------------------------------------------------------------------
# Failure and retry logic
# ---------------------------------------------------------------------------


class TestFailureHandling:
    """Task marks as failed after max attempts."""

    @pytest.mark.django_db(transaction=True)
    def test_marks_failed_after_max_attempts(self, db, article_content_type):
        """Job with attempts at max-1 gets marked failed on next error."""
        # Create article then delete it so the job fails on lookup
        art = Article.objects.create(
            slug_fa="مقاله-حذف",
            slug_en="deleted-article",
            title_fa="مقاله حذف شده",
            title_en="Deleted Article",
            status="scheduled",
        )
        job = ScheduledPublish.objects.create(
            content_type=article_content_type,
            object_id=art.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="pending",
            attempts=MAX_ATTEMPTS - 1,
        )
        # Delete the article so the publish will fail
        art.delete()

        result = process_scheduled_publishes()
        job.refresh_from_db()
        assert job.status == "failed"
        assert job.attempts == MAX_ATTEMPTS
        assert job.last_error != ""
        assert result["failed"] == 1

    @pytest.mark.django_db(transaction=True)
    def test_increments_attempts_on_error(self, db, article_content_type):
        """Job that fails but hasn't reached max attempts stays pending."""
        art = Article.objects.create(
            slug_fa="مقاله-خطا",
            slug_en="error-article",
            title_fa="مقاله خطا",
            title_en="Error Article",
            status="scheduled",
        )
        job = ScheduledPublish.objects.create(
            content_type=article_content_type,
            object_id=art.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="pending",
            attempts=0,
        )
        # Delete article to cause failure
        art.delete()

        process_scheduled_publishes()
        job.refresh_from_db()
        assert job.attempts == 1
        assert job.status == "pending"
        assert job.last_error != ""


# ---------------------------------------------------------------------------
# Idempotency
# ---------------------------------------------------------------------------


class TestIdempotency:
    """Task is idempotent — doesn't re-publish completed jobs."""

    @pytest.mark.django_db(transaction=True)
    def test_does_not_reprocess_completed_jobs(self, article, article_content_type):
        """Completed jobs are not touched when task runs again."""
        ScheduledPublish.objects.create(
            content_type=article_content_type,
            object_id=article.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="completed",
        )

        result = process_scheduled_publishes()
        assert result["completed"] == 0
        article.refresh_from_db()
        assert article.status == "scheduled"  # unchanged

    @pytest.mark.django_db(transaction=True)
    def test_does_not_retry_failed_jobs(self, article, article_content_type):
        """Failed jobs are not retried on subsequent runs."""
        ScheduledPublish.objects.create(
            content_type=article_content_type,
            object_id=article.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="failed",
        )

        result = process_scheduled_publishes()
        assert result["completed"] == 0
        assert result["failed"] == 0

    @pytest.mark.django_db(transaction=True)
    def test_already_published_entity_skipped_gracefully(
        self, db, article_content_type
    ):
        """If entity is already published, task completes without error."""
        art = Article.objects.create(
            slug_fa="مقاله-قبلا-منتشر",
            slug_en="already-published",
            title_fa="مقاله قبلا منتشر شده",
            title_en="Already Published Article",
            status="published",
            published_at=timezone.now(),
        )
        ScheduledPublish.objects.create(
            content_type=article_content_type,
            object_id=art.pk,
            scheduled_at=timezone.now() - timedelta(minutes=5),
            status="pending",
        )

        result = process_scheduled_publishes()
        # The job should still be marked as completed (entity is already published)
        assert result["completed"] == 1
