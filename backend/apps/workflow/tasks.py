"""Celery tasks for the workflow module.

Provides `process_scheduled_publishes` — a periodic task that queries pending
ScheduledPublish records whose scheduled_at <= now and publishes the referenced
entities. The task is idempotent and uses retry logic with a max of 3 attempts
before marking a job as "failed".
"""

from __future__ import annotations

import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3


@shared_task(name="apps.workflow.tasks.process_scheduled_publishes")
def process_scheduled_publishes() -> dict:
    """Process all pending scheduled publish jobs whose time has arrived.

    For each ScheduledPublish record where:
      - status == "pending"
      - scheduled_at <= now (timezone-aware comparison)

    Attempts to publish the referenced entity by setting its status to
    "published" and its published_at to the current time.

    On success: marks ScheduledPublish as "completed".
    On failure: increments attempts and records last_error.
                After MAX_ATTEMPTS (3), marks as "failed".

    This task is idempotent: re-running it will not re-publish completed jobs
    or retry jobs that have been marked as "failed".

    Returns:
        dict with counts of completed and failed publish attempts in this run.
    """
    from apps.workflow.models import ScheduledPublish

    now = timezone.now()
    pending_jobs = ScheduledPublish.objects.filter(
        status="pending",
        scheduled_at__lte=now,
    ).select_for_update(skip_locked=True)

    completed_count = 0
    failed_count = 0

    for job in pending_jobs:
        try:
            _publish_entity(job)
            job.status = "completed"
            job.save(update_fields=["status"])
            completed_count += 1
            logger.info(
                "Scheduled publish completed: job=%s, content_type=%s, object_id=%s",
                job.pk,
                job.content_type_id,
                job.object_id,
            )
        except Exception as exc:
            job.attempts += 1
            job.last_error = str(exc)[:2000]

            if job.attempts >= MAX_ATTEMPTS:
                job.status = "failed"
                failed_count += 1
                logger.error(
                    "Scheduled publish failed permanently: job=%s, "
                    "object_id=%s, attempts=%d, error=%s",
                    job.pk,
                    job.object_id,
                    job.attempts,
                    exc,
                )
            else:
                logger.warning(
                    "Scheduled publish attempt failed: job=%s, "
                    "object_id=%s, attempts=%d, error=%s",
                    job.pk,
                    job.object_id,
                    job.attempts,
                    exc,
                )

            job.save(update_fields=["attempts", "last_error", "status"])

    if completed_count or failed_count:
        logger.info(
            "process_scheduled_publishes run: completed=%d, failed=%d",
            completed_count,
            failed_count,
        )

    return {"completed": completed_count, "failed": failed_count}


def _publish_entity(job) -> None:
    """Publish the entity referenced by a ScheduledPublish job.

    Sets the entity's status to "published" and published_at to now.
    Runs within a transaction to maintain data consistency.

    Raises:
        Exception: If the entity cannot be found or doesn't support publishing.
    """
    with transaction.atomic():
        model_class = job.content_type.model_class()
        if model_class is None:
            raise ValueError(
                f"Cannot resolve model class for content_type_id={job.content_type_id}"
            )

        entity = model_class.objects.select_for_update().get(pk=job.object_id)

        if not hasattr(entity, "status"):
            raise ValueError(
                f"{model_class.__name__} does not have a 'status' field"
            )

        # Idempotency: if already published, skip.
        if entity.status == "published":
            return

        entity.status = "published"
        if hasattr(entity, "published_at"):
            entity.published_at = timezone.now()
        entity.save()
