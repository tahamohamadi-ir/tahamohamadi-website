"""Tests for safe cleanup of obsolete development seed media."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.core.management.commands.seed_data import Command
from apps.identity.models import SiteProfile
from apps.media.models import MediaAsset
from apps.siteconfig.models import NavigationItem, SiteSettings


@pytest.mark.django_db
def test_cleanup_removes_missing_seed_media_only():
    broken_seed = MediaAsset.objects.create(
        file="media/seed/missing.jpg",
        original_filename="missing.jpg",
        mime_type="image/jpeg",
        file_size=1,
        checksum="a" * 64,
    )
    retained_upload = MediaAsset.objects.create(
        file="media/2026/07/actual.jpg",
        original_filename="actual.jpg",
        mime_type="image/jpeg",
        file_size=1,
        checksum="b" * 64,
    )

    assert Command()._remove_broken_seed_media() == 1
    assert not MediaAsset.objects.filter(pk=broken_seed.pk).exists()
    assert MediaAsset.objects.filter(pk=retained_upload.pk).exists()


@pytest.mark.django_db
def test_identity_and_siteconfig_seed_records_are_idempotent_and_draft_only():
    command = Command()

    command._create_identity_and_siteconfig_drafts()
    command._create_identity_and_siteconfig_drafts()

    assert SiteProfile.objects.filter(name_en="Taha Mohamadi", status="published").count() == 1
    assert SiteSettings.objects.filter(status="published").count() == 1
    assert NavigationItem.objects.filter(label_en="Home", status="published").count() == 1
    assert not SiteProfile.objects.exclude(public_email="").exists()


@pytest.mark.django_db
def test_admin_seed_review_requires_auth_and_never_allows_automatic_publish():
    Command()._create_identity_and_siteconfig_drafts()
    client = APIClient()
    assert client.get("/api/admin/seed-review/").status_code == 403

    client.force_authenticate(get_user_model().objects.create_user(username="seed-reviewer"))
    response = client.get("/api/admin/seed-review/")

    assert response.status_code == 200
    assert response.json()["automatic_publish_allowed"] is False
    assert response.json()["seed_record_count"] == 7
    assert len(response.json()["issues"]) == 7
