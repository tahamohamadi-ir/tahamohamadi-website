"""Unit tests for CMS block validation, optimistic locking, and public projection.

Covers:
- Block registry validation (validate_block_settings, is_known_block_type)
- Optimistic locking (save_with_optimistic_lock)
- Page composition validation (validate_page_composition)
- Public projection serializers (PublicPageSerializer, PublicSectionSerializer, PublicBlockSerializer)

Requirements: 15.1
"""

import pytest

from apps.cms.block_registry import is_known_block_type, validate_block_settings
from apps.cms.services import validate_page_composition
from apps.core.services import ConflictError, save_with_optimistic_lock


# ===========================================================================
# 1. Block registry validation
# ===========================================================================


class TestValidateBlockSettings:
    """Tests for validate_block_settings function."""

    def test_hero_valid_settings(self):
        """Valid hero settings with all required fields should return no errors."""
        errors = validate_block_settings("hero", {"title": "Hello World"})
        assert errors == []

    def test_hero_valid_with_optional_fields(self):
        """Hero with optional fields filled should validate."""
        settings = {
            "title": "Test",
            "subtitle": "Sub",
            "media_id": "12345678-1234-1234-1234-123456789abc",
            "cta_url": "https://example.com",
        }
        errors = validate_block_settings("hero", settings)
        assert errors == []

    def test_text_valid_settings(self):
        """Valid text block settings should pass."""
        errors = validate_block_settings("text", {"content": "Hello", "alignment": "center"})
        assert errors == []

    def test_gallery_valid_settings(self):
        """Valid gallery settings should pass."""
        settings = {
            "media_ids": ["12345678-1234-1234-1234-123456789abc"],
            "layout": "grid",
        }
        errors = validate_block_settings("gallery", settings)
        assert errors == []

    def test_cta_valid_settings(self):
        """Valid CTA block settings should pass."""
        settings = {"label": "Click", "url": "https://x.com", "variant": "primary"}
        errors = validate_block_settings("cta", settings)
        assert errors == []

    def test_quote_valid_settings(self):
        """Valid quote block settings should pass."""
        errors = validate_block_settings("quote", {"text": "Wise words"})
        assert errors == []

    def test_divider_valid_settings(self):
        """Valid divider block settings should pass."""
        errors = validate_block_settings("divider", {"style": "line"})
        assert errors == []

    def test_research_focus_valid_settings(self):
        """Valid research_focus block settings should pass."""
        settings = {"title": "AI Research", "description": "Desc"}
        errors = validate_block_settings("research_focus", settings)
        assert errors == []

    def test_collection_valid_settings(self):
        """Valid collection block settings should pass."""
        settings = {"source": "posts", "filter": {}, "limit": 10}
        errors = validate_block_settings("collection", settings)
        assert errors == []

    def test_hero_missing_required_title(self):
        """Hero without required 'title' should return errors."""
        errors = validate_block_settings("hero", {})
        assert len(errors) >= 1
        assert any("title" in e.lower() or "required" in e.lower() for e in errors)

    def test_text_missing_required_fields(self):
        """Text block without 'content' and 'alignment' should return errors."""
        errors = validate_block_settings("text", {})
        assert len(errors) >= 1

    def test_text_wrong_alignment_enum(self):
        """Text block with invalid alignment value should fail."""
        errors = validate_block_settings("text", {"content": "Hi", "alignment": "justify"})
        assert len(errors) >= 1

    def test_gallery_wrong_layout_type(self):
        """Gallery with invalid layout enum should fail."""
        errors = validate_block_settings("gallery", {"media_ids": [], "layout": "masonry"})
        assert len(errors) >= 1

    def test_hero_additional_properties_rejected(self):
        """Hero with extra fields should fail (additionalProperties: false)."""
        settings = {"title": "Hi", "unknown_field": "oops"}
        errors = validate_block_settings("hero", settings)
        assert len(errors) >= 1

    def test_unknown_block_type_raises_value_error(self):
        """Unknown block_type should raise ValueError."""
        with pytest.raises(ValueError, match="Unknown block_type"):
            validate_block_settings("nonexistent_type", {})


class TestIsKnownBlockType:
    """Tests for is_known_block_type function."""

    def test_known_types_return_true(self):
        """All registered block types should return True."""
        known = ["hero", "text", "gallery", "cta", "collection", "quote", "divider", "research_focus"]
        for block_type in known:
            assert is_known_block_type(block_type) is True

    def test_unknown_type_returns_false(self):
        """An unregistered block type should return False."""
        assert is_known_block_type("unknown_widget") is False

    def test_empty_string_returns_false(self):
        """Empty string should return False."""
        assert is_known_block_type("") is False


# ===========================================================================
# 2. Optimistic locking (save_with_optimistic_lock)
# ===========================================================================


@pytest.mark.django_db(transaction=True)
class TestSaveWithOptimisticLock:
    """Tests for save_with_optimistic_lock service function using real DB."""

    def _create_page(self, slug_suffix=""):
        """Create a real Page instance for testing optimistic locking."""
        from apps.cms.models import Page

        return Page.objects.create(
            slug_fa=f"قفل{slug_suffix}",
            slug_en=f"lock-test{slug_suffix}",
            title_fa="قفل",
            title_en="Lock Test",
            page_type="custom",
            status="draft",
        )

    def test_successful_save_increments_version(self):
        """When version matches, data is applied and version increments."""
        page = self._create_page("-v1")
        assert page.version == 1

        result = save_with_optimistic_lock(
            page, incoming_version=1, data={"title_en": "Updated Title"}
        )

        assert result.version == 2
        assert result.title_en == "Updated Title"

    def test_conflict_error_on_version_mismatch(self):
        """When version doesn't match, ConflictError is raised."""
        page = self._create_page("-v2")
        assert page.version == 1

        with pytest.raises(ConflictError) as exc_info:
            save_with_optimistic_lock(
                page, incoming_version=5, data={"title_en": "Should Fail"}
            )

        assert exc_info.value.current_version == 1

    def test_data_applied_on_successful_save(self):
        """Multiple data fields should all be applied on success."""
        page = self._create_page("-v3")

        result = save_with_optimistic_lock(
            page, incoming_version=1, data={"title_en": "New Title", "status": "published"}
        )

        assert result.title_en == "New Title"
        assert result.status == "published"
        assert result.version == 2


# ===========================================================================
# 3. Page composition validation (validate_page_composition)
# ===========================================================================


class TestValidatePageComposition:
    """Tests for validate_page_composition service function."""

    def test_valid_composition_returns_empty_errors(self):
        """A well-formed page composition should have no errors."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {"ordering": 0, "block_type": "hero", "settings": {"title": "Hello"}},
                        {"ordering": 1, "block_type": "text", "settings": {"content": "Body", "alignment": "start"}},
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert errors == []

    def test_detects_section_ordering_gap(self):
        """Non-contiguous section orderings should be detected."""
        page_data = {
            "sections": [
                {"ordering": 0, "blocks": []},
                {"ordering": 2, "blocks": []},  # gap: skips 1
            ]
        }
        errors = validate_page_composition(page_data)
        assert len(errors) >= 1
        assert any("gap" in e.lower() for e in errors)

    def test_detects_section_ordering_duplicate(self):
        """Duplicate section orderings should be detected."""
        page_data = {
            "sections": [
                {"ordering": 0, "blocks": []},
                {"ordering": 0, "blocks": []},  # duplicate
            ]
        }
        errors = validate_page_composition(page_data)
        assert len(errors) >= 1
        assert any("duplicate" in e.lower() for e in errors)

    def test_detects_block_ordering_gap(self):
        """Non-contiguous block orderings within a section should be detected."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {"ordering": 0, "block_type": "hero", "settings": {"title": "Hi"}},
                        {"ordering": 3, "block_type": "text", "settings": {"content": "X", "alignment": "start"}},
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert len(errors) >= 1
        assert any("gap" in e.lower() for e in errors)

    def test_detects_unknown_block_type(self):
        """Unknown block_type in a block should generate an error."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {"ordering": 0, "block_type": "nonexistent_widget", "settings": {}},
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert len(errors) >= 1
        assert any("unknown block_type" in e.lower() for e in errors)

    def test_detects_invalid_settings_per_schema(self):
        """Invalid settings for a known block_type should be caught."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        # hero requires title
                        {"ordering": 0, "block_type": "hero", "settings": {}},
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert len(errors) >= 1

    def test_detects_unsafe_urls_in_cta(self):
        """Unsafe CTA URLs (e.g., javascript:) should be detected."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "ordering": 0,
                            "block_type": "cta",
                            "settings": {
                                "label": "Click",
                                "url": "javascript:alert(1)",
                                "variant": "primary",
                            },
                        },
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert len(errors) >= 1
        assert any("unsafe" in e.lower() for e in errors)

    def test_detects_unsafe_urls_in_hero_cta_url(self):
        """Unsafe hero cta_url should be detected."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "ordering": 0,
                            "block_type": "hero",
                            "settings": {
                                "title": "Hi",
                                "cta_url": "data:text/html,<script>alert(1)</script>",
                            },
                        },
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert len(errors) >= 1
        assert any("unsafe" in e.lower() for e in errors)

    def test_detects_invalid_media_uuids(self):
        """Invalid media UUID format should be detected."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "ordering": 0,
                            "block_type": "hero",
                            "settings": {
                                "title": "Hi",
                                "media_id": "not-a-valid-uuid",
                            },
                        },
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert len(errors) >= 1
        assert any("invalid media uuid" in e.lower() or "media" in e.lower() for e in errors)

    def test_detects_nonexistent_media_uuids_when_known_set_provided(self):
        """Media IDs not in the known set should generate errors."""
        missing_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "ordering": 0,
                            "block_type": "hero",
                            "settings": {
                                "title": "Hi",
                                "media_id": missing_id,
                            },
                        },
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data, known_media_ids=set())
        assert len(errors) >= 1
        assert any("not found" in e.lower() for e in errors)

    def test_rejects_animation_media_url_instead_of_media_asset_uuid(self):
        """Animation blocks persist a MediaAsset UUID, never an arbitrary URL."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "ordering": 0,
                            "block_type": "image_reveal",
                            "settings": {
                                "media_url": "https://example.com/image.jpg",
                                "duration": 250,
                                "delay": 0,
                                "easing": "ease-out",
                                "trigger": "scroll",
                            },
                        }
                    ],
                }
            ]
        }

        errors = validate_page_composition(page_data)

        assert errors
        assert any("media_id" in error for error in errors)

    def test_rejects_archived_animation_media_asset(self):
        """Animation media IDs must be present in the supplied active-media set."""
        media_id = "33333333-3333-4333-8333-333333333333"
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "ordering": 0,
                            "block_type": "image_reveal",
                            "settings": {
                                "media_id": media_id,
                                "duration": 250,
                                "delay": 0,
                                "easing": "ease-out",
                                "trigger": "scroll",
                            },
                        }
                    ],
                }
            ]
        }

        errors = validate_page_composition(page_data, known_media_ids=set())

        assert any("not found" in error.lower() for error in errors)

    def test_no_sections_key_returns_empty(self):
        """A page_data without 'sections' key should return no errors."""
        errors = validate_page_composition({})
        assert errors == []

    def test_safe_https_url_passes(self):
        """A valid HTTPS CTA URL should not trigger errors."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "ordering": 0,
                            "block_type": "cta",
                            "settings": {
                                "label": "Visit",
                                "url": "https://example.com/page",
                                "variant": "secondary",
                            },
                        },
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert errors == []

    def test_safe_internal_url_passes(self):
        """An internal locale-aware path should be accepted."""
        page_data = {
            "sections": [
                {
                    "ordering": 0,
                    "blocks": [
                        {
                            "ordering": 0,
                            "block_type": "cta",
                            "settings": {
                                "label": "Home",
                                "url": "/fa/home",
                                "variant": "primary",
                            },
                        },
                    ],
                }
            ]
        }
        errors = validate_page_composition(page_data)
        assert errors == []


# ===========================================================================
# 4. Public projection serializers
# ===========================================================================


class TestPublicPageSerializerFields:
    """Tests for PublicPageSerializer field exclusion (no DB needed)."""

    def test_excludes_version_field(self):
        """PublicPageSerializer should not include the 'version' field."""
        from apps.cms.serializers import PublicPageSerializer

        fields = PublicPageSerializer().get_fields()
        assert "version" not in fields

    def test_excludes_status_field(self):
        """PublicPageSerializer should not include 'status' field."""
        from apps.cms.serializers import PublicPageSerializer

        fields = PublicPageSerializer().get_fields()
        assert "status" not in fields

    def test_includes_expected_public_fields(self):
        """PublicPageSerializer should include public-facing fields."""
        from apps.cms.serializers import PublicPageSerializer

        fields = PublicPageSerializer().get_fields()
        expected = {"id", "slug_fa", "slug_en", "title_fa", "title_en", "page_type", "published_at", "sections"}
        assert expected.issubset(set(fields.keys()))


class TestPublicSectionSerializerFields:
    """Tests for PublicSectionSerializer field exclusion (no DB needed)."""

    def test_does_not_include_enabled_field(self):
        """PublicSectionSerializer should not expose the 'enabled' field."""
        from apps.cms.serializers import PublicSectionSerializer

        fields = PublicSectionSerializer().get_fields()
        assert "enabled" not in fields


class TestPublicBlockSerializerFields:
    """Tests for PublicBlockSerializer field projection (no DB needed)."""

    def test_includes_expected_fields(self):
        """PublicBlockSerializer should include id, block_type, settings, ordering."""
        from apps.cms.serializers import PublicBlockSerializer

        fields = PublicBlockSerializer().get_fields()
        expected = {"id", "block_type", "settings", "ordering"}
        assert expected == set(fields.keys())


@pytest.mark.django_db(transaction=True)
class TestPublicPageSerializerWithDB:
    """Tests for PublicPageSerializer that need model instances."""

    def test_only_enabled_sections_serialized(self):
        """PublicPageSerializer.get_sections should filter out disabled sections."""
        from apps.cms.models import Page, Section
        from apps.cms.serializers import PublicPageSerializer

        page = Page.objects.create(
            slug_fa="تست",
            slug_en="test-page",
            title_fa="تست",
            title_en="Test",
            page_type="custom",
            status="published",
        )
        Section.objects.create(page=page, ordering=0, enabled=True, layout="default")
        Section.objects.create(page=page, ordering=1, enabled=False, layout="default")

        serializer = PublicPageSerializer(page)
        data = serializer.data

        # Only the enabled section should appear
        assert len(data["sections"]) == 1


@pytest.mark.django_db(transaction=True)
class TestPublicSectionSerializerWithDB:
    """Tests for PublicSectionSerializer — excludes unknown block types."""

    def test_excludes_unknown_block_types(self):
        """Blocks with unknown block_type should be filtered out."""
        from apps.cms.models import Block, Page, Section
        from apps.cms.serializers import PublicSectionSerializer

        page = Page.objects.create(
            slug_fa="بخش",
            slug_en="section-test",
            title_fa="بخش",
            title_en="Section Test",
            page_type="custom",
            status="published",
        )
        section = Section.objects.create(page=page, ordering=0, enabled=True)
        # Valid block
        Block.objects.create(
            section=section, block_type="hero", settings={"title": "Hi"}, ordering=0
        )
        # Unknown block type — should be excluded
        Block.objects.create(
            section=section, block_type="unknown_widget", settings={}, ordering=1
        )

        serializer = PublicSectionSerializer(section)
        data = serializer.data

        # Only the hero block should be in output
        assert len(data["blocks"]) == 1
        assert data["blocks"][0]["block_type"] == "hero"


@pytest.mark.django_db(transaction=True)
class TestPublicBlockSerializerWithDB:
    """Tests for PublicBlockSerializer — read-only projection with real data."""

    def test_serializes_block_correctly(self):
        """PublicBlockSerializer should serialize a block instance."""
        from apps.cms.models import Block, Page, Section
        from apps.cms.serializers import PublicBlockSerializer

        page = Page.objects.create(
            slug_fa="بلوک",
            slug_en="block-test",
            title_fa="بلوک",
            title_en="Block Test",
            page_type="custom",
            status="published",
        )
        section = Section.objects.create(page=page, ordering=0, enabled=True)
        block = Block.objects.create(
            section=section, block_type="quote", settings={"text": "Wise"}, ordering=0
        )

        serializer = PublicBlockSerializer(block)
        data = serializer.data

        assert data["block_type"] == "quote"
        assert data["settings"] == {"text": "Wise"}
        assert data["ordering"] == 0
