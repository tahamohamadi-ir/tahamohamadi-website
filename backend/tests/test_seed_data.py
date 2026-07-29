"""Tests for safe cleanup of obsolete development seed media."""

import pytest

from apps.core.management.commands.seed_data import Command
from apps.media.models import MediaAsset


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
