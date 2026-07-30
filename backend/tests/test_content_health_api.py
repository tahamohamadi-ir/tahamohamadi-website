"""Admin content-health report only returns real actionable findings."""

from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.media.models import MediaAsset
from apps.workflow.models import ScheduledPublish


@pytest.mark.django_db
def test_content_health_reports_missing_alt_orphan_media_and_failed_schedules(
    admin_client: APIClient,
):
    asset = MediaAsset.objects.create(
        file=SimpleUploadedFile("no-alt.png", b"image", content_type="image/png"),
        original_filename="no-alt.png",
        mime_type="image/png",
        file_size=5,
        width=1,
        height=1,
        checksum="a" * 64,
    )
    ScheduledPublish.objects.create(
        content_type=ContentType.objects.get_for_model(MediaAsset),
        object_id=asset.id,
        scheduled_at=timezone.now(),
        status="failed",
        last_error="The scheduled task failed.",
    )

    response = admin_client.get("/api/admin/content-health/")

    assert response.status_code == status.HTTP_200_OK
    report = response.json()
    assert report["missing_media_alt"]["count"] == 1
    assert report["missing_media_alt"]["items"] == [{
        "title": "no-alt.png",
        "missing_locales": ["fa", "en"],
        "action_path": "/admin/media",
    }]
    assert report["orphan_media"]["count"] == 1
    assert report["orphan_media"]["items"][0]["title"] == "no-alt.png"
    assert report["failed_schedules"]["count"] == 1
    assert report["failed_schedules"]["items"] == [{
        "content_type": "media.mediaasset",
        "action_path": "/admin/workflow",
    }]
    assert str(asset.id) not in response.content.decode()
