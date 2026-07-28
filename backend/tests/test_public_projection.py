"""Tests for public projection serializers (task 2.8).

Validates the PublicPageSerializer, PublicSectionSerializer, and
PublicBlockSerializer behaviour:
- Internal fields (version, created_by, updated_by, status) are excluded
- Only enabled sections are returned
- Blocks with unknown block_types are excluded (fail-closed, Req 4.9)
- Sections are returned in ordering order
- Blocks within sections are returned in ordering order

These tests require the database (model instances with related objects),
so they are marked with @pytest.mark.django_db.
"""

import uuid

import pytest

from apps.cms.models import Block, Page, Section
from apps.cms.serializers import (
    PublicBlockSerializer,
    PublicPageSerializer,
    PublicSectionSerializer,
)


@pytest.fixture()
def published_page(db):
    """Create a published page with multiple sections and blocks."""
    page = Page.objects.create(
        slug_fa="صفحه-تست",
        slug_en="test-page",
        title_fa="صفحه تست",
        title_en="Test Page",
        page_type="custom",
        status="published",
    )
    return page


@pytest.fixture()
def sections_with_blocks(published_page):
    """Create sections and blocks for the published page.

    Section layout:
    - Section A (ordering=2, enabled=True) — has hero + text blocks
    - Section B (ordering=1, enabled=True) — has cta block
    - Section C (ordering=3, enabled=False) — disabled, should be excluded
    """
    section_a = Section.objects.create(
        page=published_page, ordering=2, enabled=True, layout="default"
    )
    section_b = Section.objects.create(
        page=published_page, ordering=1, enabled=True, layout="wide"
    )
    section_c = Section.objects.create(
        page=published_page, ordering=3, enabled=False, layout="default"
    )

    # Blocks in section A: hero (ordering=1), text (ordering=0)
    Block.objects.create(
        section=section_a,
        block_type="hero",
        settings={"title": "Welcome"},
        ordering=1,
    )
    Block.objects.create(
        section=section_a,
        block_type="text",
        settings={"content": "Hello", "alignment": "start"},
        ordering=0,
    )

    # Block in section B: cta (ordering=0)
    Block.objects.create(
        section=section_b,
        block_type="cta",
        settings={"label": "Go", "url": "https://example.com", "variant": "primary"},
        ordering=0,
    )

    # Block in section C (disabled section): text
    Block.objects.create(
        section=section_c,
        block_type="text",
        settings={"content": "Hidden", "alignment": "center"},
        ordering=0,
    )

    return section_a, section_b, section_c


# ---------------------------------------------------------------------------
# PublicPageSerializer — field exclusion
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicPageSerializerFieldExclusion:
    """Public serializer must exclude internal fields."""

    def test_excludes_version_field(self, published_page):
        data = PublicPageSerializer(published_page).data
        assert "version" not in data

    def test_excludes_status_field(self, published_page):
        data = PublicPageSerializer(published_page).data
        assert "status" not in data

    def test_excludes_created_by_and_updated_by(self, published_page):
        """created_by and updated_by from TimestampedModel are not in the output."""
        data = PublicPageSerializer(published_page).data
        assert "created_by" not in data
        assert "updated_by" not in data

    def test_excludes_created_at_and_updated_at(self, published_page):
        """Audit timestamps are not in the public response."""
        data = PublicPageSerializer(published_page).data
        assert "created_at" not in data
        assert "updated_at" not in data

    def test_includes_public_fields(self, published_page):
        data = PublicPageSerializer(published_page).data
        assert "id" in data
        assert "slug_fa" in data
        assert "slug_en" in data
        assert "title_fa" in data
        assert "title_en" in data
        assert "page_type" in data
        assert "published_at" in data
        assert "sections" in data


# ---------------------------------------------------------------------------
# PublicPageSerializer — section filtering and ordering
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicPageSerializerSections:
    """Only enabled sections are included, in ordering order."""

    def test_excludes_disabled_sections(self, published_page, sections_with_blocks):
        data = PublicPageSerializer(published_page).data
        # We have 3 sections but only 2 are enabled
        assert len(data["sections"]) == 2

    def test_sections_ordered_by_ordering_field(self, published_page, sections_with_blocks):
        data = PublicPageSerializer(published_page).data
        section_orderings = [s["ordering"] for s in data["sections"]]
        # Section B has ordering=1, Section A has ordering=2
        assert section_orderings == [1, 2]

    def test_section_layout_included(self, published_page, sections_with_blocks):
        data = PublicPageSerializer(published_page).data
        layouts = [s["layout"] for s in data["sections"]]
        # Ordered by ordering: section B (wide) first, section A (default) second
        assert layouts == ["wide", "default"]


# ---------------------------------------------------------------------------
# PublicSectionSerializer — block filtering (fail-closed)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicSectionSerializerBlockFiltering:
    """Blocks with unknown block_types are excluded from public responses."""

    def test_excludes_unknown_block_types(self, published_page):
        """Blocks with unregistered block_types must be excluded (Req 4.9)."""
        section = Section.objects.create(
            page=published_page, ordering=0, enabled=True, layout="default"
        )
        # Known block
        Block.objects.create(
            section=section, block_type="hero", settings={"title": "Hi"}, ordering=0
        )
        # Unknown block — should be excluded
        Block.objects.create(
            section=section, block_type="unknown_widget", settings={}, ordering=1
        )

        data = PublicSectionSerializer(section).data
        assert len(data["blocks"]) == 1
        assert data["blocks"][0]["block_type"] == "hero"

    def test_all_blocks_unknown_returns_empty(self, published_page):
        """If all blocks have unknown types, the section returns no blocks."""
        section = Section.objects.create(
            page=published_page, ordering=0, enabled=True, layout="default"
        )
        Block.objects.create(
            section=section, block_type="nonexistent_type", settings={}, ordering=0
        )
        Block.objects.create(
            section=section, block_type="another_bad_type", settings={}, ordering=1
        )

        data = PublicSectionSerializer(section).data
        assert data["blocks"] == []

    def test_blocks_ordered_by_ordering_field(self, published_page, sections_with_blocks):
        """Blocks within a section are returned in ordering order."""
        section_a, _, _ = sections_with_blocks
        data = PublicSectionSerializer(section_a).data
        block_orderings = [b["ordering"] for b in data["blocks"]]
        # text (ordering=0) before hero (ordering=1)
        assert block_orderings == [0, 1]

    def test_blocks_include_correct_fields(self, published_page, sections_with_blocks):
        """PublicBlockSerializer exposes id, block_type, settings, ordering."""
        section_a, _, _ = sections_with_blocks
        data = PublicSectionSerializer(section_a).data
        block = data["blocks"][0]
        assert "id" in block
        assert "block_type" in block
        assert "settings" in block
        assert "ordering" in block


# ---------------------------------------------------------------------------
# PublicBlockSerializer — field validation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicBlockSerializer:
    """Public block serializer returns minimal fields."""

    def test_serializes_block_correctly(self, published_page):
        section = Section.objects.create(
            page=published_page, ordering=0, enabled=True, layout="default"
        )
        block = Block.objects.create(
            section=section,
            block_type="quote",
            settings={"text": "Test quote"},
            ordering=0,
        )
        data = PublicBlockSerializer(block).data
        assert data["block_type"] == "quote"
        assert data["settings"] == {"text": "Test quote"}
        assert data["ordering"] == 0
        assert "id" in data

    def test_does_not_expose_section_fk(self, published_page):
        """The section foreign key is not in the public output."""
        section = Section.objects.create(
            page=published_page, ordering=0, enabled=True, layout="default"
        )
        block = Block.objects.create(
            section=section, block_type="divider", settings={"style": "line"}, ordering=0
        )
        data = PublicBlockSerializer(block).data
        assert "section" not in data
        assert "section_id" not in data


# ---------------------------------------------------------------------------
# PublicSectionSerializer — field validation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicSectionSerializer:
    """Public section serializer field coverage."""

    def test_excludes_enabled_field(self, published_page):
        """The 'enabled' field is not in the public section output
        (since we only show enabled sections anyway)."""
        section = Section.objects.create(
            page=published_page, ordering=0, enabled=True, layout="default"
        )
        data = PublicSectionSerializer(section).data
        assert "enabled" not in data

    def test_includes_expected_fields(self, published_page):
        section = Section.objects.create(
            page=published_page, ordering=0, enabled=True, layout="default"
        )
        data = PublicSectionSerializer(section).data
        assert "id" in data
        assert "ordering" in data
        assert "layout" in data
        assert "blocks" in data

    def test_excludes_page_fk(self, published_page):
        """The page foreign key is not in the public section output."""
        section = Section.objects.create(
            page=published_page, ordering=0, enabled=True, layout="default"
        )
        data = PublicSectionSerializer(section).data
        assert "page" not in data
        assert "page_id" not in data


# ---------------------------------------------------------------------------
# End-to-end: full page projection
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicProjectionEndToEnd:
    """Full public projection: page → enabled sections → valid blocks only."""

    def test_full_projection_structure(self, published_page, sections_with_blocks):
        """Verify the complete projection of a page with mixed sections."""
        data = PublicPageSerializer(published_page).data

        # Page-level checks
        assert data["slug_en"] == "test-page"
        assert data["title_en"] == "Test Page"
        assert "version" not in data
        assert "status" not in data

        # Only enabled sections (2 out of 3)
        assert len(data["sections"]) == 2

        # First section (ordering=1, section B) has 1 block
        first_section = data["sections"][0]
        assert first_section["ordering"] == 1
        assert len(first_section["blocks"]) == 1
        assert first_section["blocks"][0]["block_type"] == "cta"

        # Second section (ordering=2, section A) has 2 blocks
        second_section = data["sections"][1]
        assert second_section["ordering"] == 2
        assert len(second_section["blocks"]) == 2
        # Blocks ordered: text (ordering=0), then hero (ordering=1)
        assert second_section["blocks"][0]["block_type"] == "text"
        assert second_section["blocks"][1]["block_type"] == "hero"

    def test_unknown_blocks_stripped_from_full_projection(self, published_page):
        """Unknown block_types are excluded even in a full page projection."""
        section = Section.objects.create(
            page=published_page, ordering=0, enabled=True, layout="default"
        )
        Block.objects.create(
            section=section, block_type="hero", settings={"title": "Hi"}, ordering=0
        )
        Block.objects.create(
            section=section, block_type="future_block_v99", settings={}, ordering=1
        )

        data = PublicPageSerializer(published_page).data
        blocks = data["sections"][0]["blocks"]
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "hero"
