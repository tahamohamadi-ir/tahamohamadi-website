"""Tests for media usage tracking service (task 3.5).

Covers:
- get_media_usage: finds references from CMS blocks (media_id and media_ids)
- get_media_usage_count: returns integer count of references
- get_orphan_media_ids: finds media assets with no references
"""

import uuid

import pytest

from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset
from apps.media.services import (
    get_media_usage,
    get_media_usage_count,
    get_orphan_media_ids,
)


@pytest.fixture()
def media_asset(db) -> MediaAsset:
    """Create a basic active media asset for testing."""
    return MediaAsset.objects.create(
        original_filename="test-image.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        file="media/2025/01/abc12345/abc12345def67890.jpg",
        checksum="abc12345def67890abc12345def67890abc12345def67890abc12345def67890",
        status="active",
    )


@pytest.fixture()
def media_asset_2(db) -> MediaAsset:
    """Create a second active media asset for testing."""
    return MediaAsset.objects.create(
        original_filename="second-image.png",
        mime_type="image/png",
        file_size=2048,
        file="media/2025/01/11111111/1111111122222222.png",
        checksum="1111111122222222333333334444444455555555666666667777777788888888",
        status="active",
    )


@pytest.fixture()
def orphan_asset(db) -> MediaAsset:
    """An active asset that is never referenced."""
    return MediaAsset.objects.create(
        original_filename="orphan.gif",
        mime_type="image/gif",
        file_size=512,
        file="media/2025/01/eeeeeeee/eeeeeeeeffffffff.gif",
        checksum="eeeeeeeefffffff0000000011111111222222223333333344444444555555555",
        status="active",
    )


@pytest.fixture()
def page(db) -> Page:
    """Create a CMS page."""
    return Page.objects.create(
        slug_fa="test-page",
        slug_en="test-page",
        title_fa="صفحه تست",
        title_en="Test Page",
        page_type="custom",
        status="published",
    )


@pytest.fixture()
def section(db, page) -> Section:
    """Create a section within the page."""
    return Section.objects.create(
        page=page,
        ordering=0,
        enabled=True,
    )


# --- get_media_usage tests -----------------------------------------------


@pytest.mark.django_db
class TestGetMediaUsage:
    """Tests for get_media_usage function."""

    def test_returns_empty_when_no_references(self, media_asset):
        """An asset not referenced by any block returns empty list."""
        result = get_media_usage(media_asset.id)
        assert result == []

    def test_finds_single_media_id_reference(self, media_asset, section):
        """Detects a block with settings.media_id referencing the asset."""
        Block.objects.create(
            section=section,
            block_type="hero",
            ordering=0,
            settings={"media_id": str(media_asset.id), "title": "Hero"},
        )

        result = get_media_usage(media_asset.id)
        assert len(result) == 1
        assert result[0]["type"] == "page"
        assert result[0]["id"] == section.page.id
        assert result[0]["title"] == "Test Page"

    def test_finds_media_ids_list_reference(self, media_asset, section):
        """Detects a block with settings.media_ids containing the asset."""
        Block.objects.create(
            section=section,
            block_type="gallery",
            ordering=0,
            settings={
                "media_ids": [str(media_asset.id), str(uuid.uuid4())],
                "layout": "grid",
            },
        )

        result = get_media_usage(media_asset.id)
        assert len(result) == 1
        assert result[0]["type"] == "page"
        assert result[0]["id"] == section.page.id

    def test_deduplicates_by_page(self, media_asset, section):
        """Multiple blocks on the same page should produce one usage record."""
        Block.objects.create(
            section=section,
            block_type="hero",
            ordering=0,
            settings={"media_id": str(media_asset.id)},
        )
        Block.objects.create(
            section=section,
            block_type="gallery",
            ordering=1,
            settings={"media_ids": [str(media_asset.id)]},
        )

        result = get_media_usage(media_asset.id)
        assert len(result) == 1

    def test_finds_across_multiple_pages(self, media_asset, page, section, db):
        """References from different pages produce multiple usage records."""
        # First reference on existing page
        Block.objects.create(
            section=section,
            block_type="hero",
            ordering=0,
            settings={"media_id": str(media_asset.id)},
        )

        # Second page with its own section and block
        page2 = Page.objects.create(
            slug_fa="page-two",
            slug_en="page-two",
            title_fa="صفحه دوم",
            title_en="Page Two",
            page_type="custom",
            status="draft",
        )
        section2 = Section.objects.create(page=page2, ordering=0, enabled=True)
        Block.objects.create(
            section=section2,
            block_type="gallery",
            ordering=0,
            settings={"media_ids": [str(media_asset.id)]},
        )

        result = get_media_usage(media_asset.id)
        assert len(result) == 2
        page_ids = {r["id"] for r in result}
        assert page.id in page_ids
        assert page2.id in page_ids

    def test_does_not_find_unrelated_blocks(self, media_asset, section):
        """Blocks referencing a different asset should not appear."""
        other_id = str(uuid.uuid4())
        Block.objects.create(
            section=section,
            block_type="hero",
            ordering=0,
            settings={"media_id": other_id},
        )

        result = get_media_usage(media_asset.id)
        assert result == []

    def test_handles_blocks_with_empty_settings(self, media_asset, section):
        """Blocks with empty settings dict should not cause errors."""
        Block.objects.create(
            section=section,
            block_type="divider",
            ordering=0,
            settings={},
        )

        result = get_media_usage(media_asset.id)
        assert result == []

    def test_uses_english_title_preferentially(self, media_asset, db):
        """Usage record title should use English title when available."""
        page = Page.objects.create(
            slug_fa="fa-only",
            slug_en="en-only",
            title_fa="عنوان فارسی",
            title_en="English Title",
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

        result = get_media_usage(media_asset.id)
        assert result[0]["title"] == "English Title"

    def test_falls_back_to_persian_title(self, media_asset, db):
        """When English title is empty, falls back to Persian title."""
        page = Page.objects.create(
            slug_fa="fa-page",
            slug_en="fa-page-en",
            title_fa="عنوان فارسی",
            title_en="",
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

        result = get_media_usage(media_asset.id)
        assert result[0]["title"] == "عنوان فارسی"


# --- get_media_usage_count tests -----------------------------------------


@pytest.mark.django_db
class TestGetMediaUsageCount:
    """Tests for get_media_usage_count function."""

    def test_returns_zero_when_no_references(self, media_asset):
        """No references means count is 0."""
        assert get_media_usage_count(media_asset.id) == 0

    def test_returns_correct_count(self, media_asset, page, section, db):
        """Returns the number of distinct pages referencing the asset."""
        # One reference on existing page
        Block.objects.create(
            section=section,
            block_type="hero",
            ordering=0,
            settings={"media_id": str(media_asset.id)},
        )

        # Second page
        page2 = Page.objects.create(
            slug_fa="count-page",
            slug_en="count-page",
            title_fa="صفحه شمارش",
            title_en="Count Page",
            page_type="custom",
            status="draft",
        )
        section2 = Section.objects.create(page=page2, ordering=0, enabled=True)
        Block.objects.create(
            section=section2,
            block_type="gallery",
            ordering=0,
            settings={"media_ids": [str(media_asset.id)]},
        )

        assert get_media_usage_count(media_asset.id) == 2


# --- get_orphan_media_ids tests ------------------------------------------


@pytest.mark.django_db
class TestGetOrphanMediaIds:
    """Tests for get_orphan_media_ids function."""

    def test_all_assets_orphan_when_no_blocks(self, media_asset, media_asset_2):
        """With no blocks at all, all active assets are orphans."""
        orphan_ids = get_orphan_media_ids()
        assert media_asset.id in orphan_ids
        assert media_asset_2.id in orphan_ids

    def test_referenced_asset_not_orphan(self, media_asset, orphan_asset, section):
        """An asset referenced by a block should not be an orphan."""
        Block.objects.create(
            section=section,
            block_type="hero",
            ordering=0,
            settings={"media_id": str(media_asset.id)},
        )

        orphan_ids = get_orphan_media_ids()
        # media_asset is referenced, should not be orphan
        assert media_asset.id not in orphan_ids
        # orphan_asset is not referenced, should be orphan
        assert orphan_asset.id in orphan_ids

    def test_asset_in_media_ids_list_not_orphan(
        self, media_asset, orphan_asset, section
    ):
        """Assets referenced via media_ids list should not be orphans."""
        Block.objects.create(
            section=section,
            block_type="gallery",
            ordering=0,
            settings={"media_ids": [str(media_asset.id)]},
        )

        orphan_ids = get_orphan_media_ids()
        assert media_asset.id not in orphan_ids
        assert orphan_asset.id in orphan_ids

    def test_archived_assets_excluded(self, db, section):
        """Archived assets should not appear in orphan list."""
        archived = MediaAsset.objects.create(
            original_filename="archived.jpg",
            mime_type="image/jpeg",
            file_size=1024,
            file="media/2025/01/archived/archived.jpg",
            checksum="archived0000000000000000000000000000000000000000000000000000000",
            status="archived",
        )

        orphan_ids = get_orphan_media_ids()
        assert archived.id not in orphan_ids

    def test_empty_database_returns_empty(self, db):
        """With no media assets at all, returns empty list."""
        orphan_ids = get_orphan_media_ids()
        assert orphan_ids == []
