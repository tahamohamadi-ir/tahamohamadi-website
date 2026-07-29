"""Contract tests for the admin media usage endpoint."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset


@pytest.fixture
def admin_client(db):
    user = get_user_model().objects.create_user(
        username="media-admin", password="not-used-in-this-test"
    )
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def media_asset(db):
    return MediaAsset.objects.create(
        original_filename="referenced-image.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        file="media/2026/07/referenced-image.jpg",
        checksum="a" * 64,
        status="active",
    )


@pytest.mark.django_db
def test_usage_endpoint_returns_cms_page_references(admin_client, media_asset):
    page = Page.objects.create(
        slug_fa="media-usage",
        slug_en="media-usage",
        title_fa="کاربرد رسانه",
        title_en="Media usage",
        page_type="custom",
        status="published",
    )
    section = Section.objects.create(page=page, ordering=0, enabled=True)
    Block.objects.create(
        section=section,
        block_type="hero",
        ordering=0,
        settings={"media_id": str(media_asset.id)},
    )

    response = admin_client.get(f"/api/admin/media/{media_asset.id}/usage/")

    assert response.status_code == 200
    assert response.json() == [
        {"type": "page", "id": str(page.id), "title": "Media usage"}
    ]
