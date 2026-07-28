"""Tests for the media archive service (task 3.6).

Covers:
- archive_media: archives active assets, warns when in use, force-archives
- unarchive_media: restores archived assets back to active
- get_media_usage: detects media references in CMS Block settings
- MediaNotFoundError: raised for invalid IDs
"""

import uuid

import pytest

from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset
from apps.media.services import (
    MediaNotFoundError,
    archive_media,
    get_media_usage,
    unarchive_media,
)


# --- Fixtures ------------------------------------------------------------


@pytest.fixture()
def media_asset(db) -> MediaAsset:
    """Create an active media asset for testing."""
    return MediaAsset.objects.create(
        original_filename="test-image.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        checksum="a" * 64,
        status="active",
        file="media/2025/01/aaaaaaaa/test.jpg",
    )


@pytest.fixture()
def archived_asset(db) -> MediaAsset:
    """Create an already-archived media asset."""
    return MediaAsset.objects.create(
        original_filename="old-image.png",
        mime_type="image/png",
        file_size=2048,
        checksum="b" * 64,
        status="archived",
        file="media/2025/01/bbbbbbbb/old.png",
    )


@pytest.fixture()
def page_with_media(db, media_asset) -> Page:
    """Create a Page -> Section -> Block referencing the media asset."""
    page = Page.objects.create(
        slug_fa="test-page-fa",
        slug_en="test-page-en",
        title_fa="Test Page FA",
        title_en="Test Page",
        page_type="custom",
        status="draft",
    )
    section = Section.objects.create(
        page=page,
        ordering=0,
    )
    Block.objects.create(
        section=section,
        block_type="image",
        ordering=0,
        settings={"media_id": str(media_asset.id)},
    )
    return page


# --- archive_media tests -------------------------------------------------


@pytest.mark.django_db
class TestArchiveMedia:
    """Tests for archive_media service function."""

    def test_archive_active_asset_not_in_use(self, media_asset):
        """An active asset with no CMS references should archive successfully."""
        result = archive_media(media_asset.id)

        assert result["success"] is True
        assert result["warning"] is None
        assert result["asset"].status == "archived"

        # Verify persisted to DB
        media_asset.refresh_from_db()
        assert media_asset.status == "archived"

    def test_archive_warns_when_in_use(self, media_asset, page_with_media):
        """Should return warning when media is referenced in CMS blocks."""
        result = archive_media(media_asset.id)

        assert result["success"] is False
        assert result["warning"] is not None
        assert "referenced by" in result["warning"]
        assert result["usage_count"] == 1

        # Asset should NOT be archived
        media_asset.refresh_from_db()
        assert media_asset.status == "active"

    def test_archive_force_when_in_use(self, media_asset, page_with_media):
        """With force=True, should archive even when media is in use."""
        result = archive_media(media_asset.id, force=True)

        assert result["success"] is True
        assert result["warning"] is None

        media_asset.refresh_from_db()
        assert media_asset.status == "archived"

    def test_archive_already_archived_asset(self, archived_asset):
        """Archiving an already-archived asset should return success without error."""
        result = archive_media(archived_asset.id)

        assert result["success"] is True
        assert result["warning"] is None
        assert result["asset"].status == "archived"

    def test_archive_nonexistent_asset_raises_error(self):
        """Should raise MediaNotFoundError for unknown UUID."""
        fake_id = uuid.uuid4()
        with pytest.raises(MediaNotFoundError) as exc_info:
            archive_media(fake_id)
        assert exc_info.value.media_id == fake_id


# --- unarchive_media tests -----------------------------------------------


@pytest.mark.django_db
class TestUnarchiveMedia:
    """Tests for unarchive_media service function."""

    def test_unarchive_archived_asset(self, archived_asset):
        """Should restore an archived asset back to active."""
        result = unarchive_media(archived_asset.id)

        assert result["success"] is True
        assert result["warning"] is None
        assert result["asset"].status == "active"

        archived_asset.refresh_from_db()
        assert archived_asset.status == "active"

    def test_unarchive_already_active_asset(self, media_asset):
        """Unarchiving an already-active asset should return success."""
        result = unarchive_media(media_asset.id)

        assert result["success"] is True
        assert result["warning"] is None
        assert result["asset"].status == "active"

    def test_unarchive_nonexistent_asset_raises_error(self):
        """Should raise MediaNotFoundError for unknown UUID."""
        fake_id = uuid.uuid4()
        with pytest.raises(MediaNotFoundError) as exc_info:
            unarchive_media(fake_id)
        assert exc_info.value.media_id == fake_id


# --- get_media_usage integration with archive ----------------------------


@pytest.mark.django_db
class TestGetMediaUsageWithArchive:
    """Tests verifying get_media_usage integrates correctly with archive."""

    def test_no_usage_returns_empty_list(self, media_asset):
        """An asset not referenced anywhere should return empty list."""
        usages = get_media_usage(media_asset.id)
        assert usages == []

    def test_detects_single_media_id_reference(self, media_asset, page_with_media):
        """Should detect a block with settings.media_id matching the asset."""
        usages = get_media_usage(media_asset.id)

        assert len(usages) == 1
        assert usages[0]["type"] == "page"
        assert usages[0]["id"] == page_with_media.id
        assert usages[0]["title"] == "Test Page"

    def test_detects_media_ids_list_reference(self, db, media_asset):
        """Should detect a block with settings.media_ids containing the asset."""
        page = Page.objects.create(
            slug_fa="gallery-fa",
            slug_en="gallery-en",
            title_fa="Gallery FA",
            title_en="Gallery",
            page_type="custom",
            status="draft",
        )
        section = Section.objects.create(page=page, ordering=0)
        Block.objects.create(
            section=section,
            block_type="gallery",
            ordering=0,
            settings={"media_ids": [str(media_asset.id), str(uuid.uuid4())]},
        )

        usages = get_media_usage(media_asset.id)

        assert len(usages) == 1
        assert usages[0]["type"] == "page"
        assert usages[0]["id"] == page.id
        assert usages[0]["title"] == "Gallery"

    def test_multiple_blocks_same_page_counted_once(self, db, media_asset):
        """Multiple blocks on the same page should result in one usage record."""
        page = Page.objects.create(
            slug_fa="multi-fa",
            slug_en="multi-en",
            title_fa="Multi FA",
            title_en="Multi",
            page_type="custom",
            status="draft",
        )
        section = Section.objects.create(page=page, ordering=0)
        Block.objects.create(
            section=section,
            block_type="image",
            ordering=0,
            settings={"media_id": str(media_asset.id)},
        )
        Block.objects.create(
            section=section,
            block_type="hero",
            ordering=1,
            settings={"media_id": str(media_asset.id)},
        )

        usages = get_media_usage(media_asset.id)

        # Should be deduplicated to 1 page entry
        assert len(usages) == 1
        assert usages[0]["title"] == "Multi"
