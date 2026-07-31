"""Integration tests for page composition API endpoints (task 2.9).

Tests the full HTTP round-trip for admin CRUD, public projection,
authentication enforcement, optimistic locking conflicts, and
composition validation errors.

All tests require PostgreSQL (marked with @pytest.mark.django_db).
Conflict tests use transaction=True for real DB transaction behaviour.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset


# ---------------------------------------------------------------------------
# Helpers / fixtures
# ---------------------------------------------------------------------------

ADMIN_PAGES_URL = "/api/admin/pages/"
PUBLIC_PAGES_URL = "/api/public/pages/"


def _valid_page_payload(**overrides):
    """Return a minimal valid page creation payload."""
    payload = {
        "slug_fa": "تست-صفحه",
        "slug_en": "test-page",
        "title_fa": "صفحه آزمایشی",
        "title_en": "Test Page",
        "page_type": "custom",
        "status": "draft",
        "sections": [
            {
                "ordering": 0,
                "enabled": True,
                "layout": "default",
                "blocks": [
                    {
                        "block_type": "hero",
                        "settings": {"title": "Welcome"},
                        "ordering": 0,
                    },
                ],
            },
        ],
    }
    payload.update(overrides)
    return payload


def _composer_default_blocks():
    """Mirror the frontend block library defaults for an HTTP contract check."""
    animation = {"duration": 600, "delay": 0, "easing": "ease-out", "trigger": "scroll"}
    settings = [
        ("hero", {"heading_fa": "", "heading_en": "", "subheading_fa": "", "subheading_en": "", "cta_text_fa": "", "cta_text_en": "", "cta_link": "", "media_id": None}),
        ("text", {"body_fa": "", "body_en": "", "alignment": "start"}),
        ("gallery", {"media_ids": [], "layout": "grid"}),
        ("cta", {"label": "", "url": "/", "variant": "primary"}),
        ("collection", {"source": "portfolio", "filter": {}, "limit": 6, "order": "default"}),
        ("quote", {"text": "", "attribution": None}),
        ("divider", {"style": "line"}),
        ("research_focus", {"title": "", "description": "", "icon": None}),
        ("scroll_reveal", {"title": "", "description": None, "direction": "up", **animation}),
        ("parallax", {"title": "", "subtitle": None, "media_url": None, "speed": 0.5, **animation}),
        ("text_stagger", {"content": "", "stagger_delay": 50, **animation}),
        ("fade_in_sequence", {"items": [], **animation}),
        ("hover_card", {"title": "", "description": "", "icon": None, "hover_effect": "lift", **animation}),
        ("counter_animation", {"label": "", "target_number": 0, "suffix": None, **animation}),
        ("image_reveal", {"media_url": "", "alt": None, "reveal_direction": "left", **animation}),
        ("section_transition", {"transition_type": "fade", **animation}),
    ]
    return [
        {"block_type": block_type, "settings": block_settings, "ordering": ordering}
        for ordering, (block_type, block_settings) in enumerate(settings)
    ]


@pytest.fixture()
def published_page(db):
    """A published page with sections and blocks for public endpoint tests."""
    page = Page.objects.create(
        slug_fa="صفحه-منتشر",
        slug_en="published-page",
        title_fa="صفحه منتشر شده",
        title_en="Published Page",
        page_type="custom",
        status="published",
    )
    # Enabled section with a valid block
    section_enabled = Section.objects.create(
        page=page, ordering=0, enabled=True, layout="default"
    )
    Block.objects.create(
        section=section_enabled,
        block_type="hero",
        settings={"title": "Hello"},
        ordering=0,
    )
    # Disabled section — should not appear in public response
    section_disabled = Section.objects.create(
        page=page, ordering=1, enabled=False, layout="default"
    )
    Block.objects.create(
        section=section_disabled,
        block_type="text",
        settings={"content": "Hidden", "alignment": "start"},
        ordering=0,
    )
    # Enabled section with an unknown block type — should be excluded
    section_with_unknown = Section.objects.create(
        page=page, ordering=2, enabled=True, layout="wide"
    )
    Block.objects.create(
        section=section_with_unknown,
        block_type="future_widget_v99",
        settings={},
        ordering=0,
    )
    Block.objects.create(
        section=section_with_unknown,
        block_type="text",
        settings={"content": "Visible", "alignment": "center"},
        ordering=1,
    )
    return page


# ===========================================================================
# 1. Admin CRUD success tests
# ===========================================================================


@pytest.mark.django_db
class TestAdminCRUDSuccess:
    """Admin page endpoints return correct status codes and data shapes."""

    def test_create_page_with_composition(self, admin_client: APIClient):
        """POST /api/admin/pages/ with valid page+sections+blocks → 201."""
        payload = _valid_page_payload()
        response = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")

        assert response.status_code == 201
        data = response.json()
        assert data["slug_en"] == "test-page"
        assert data["title_en"] == "Test Page"
        assert data["version"] == 1
        assert len(data["sections"]) == 1
        assert len(data["sections"][0]["blocks"]) == 1
        assert data["sections"][0]["blocks"][0]["block_type"] == "hero"

    def test_retrieve_page_with_nested_sections(self, admin_client: APIClient):
        """GET /api/admin/pages/{id}/ → 200 with full nested data."""
        # Create first
        payload = _valid_page_payload()
        create_resp = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")
        page_id = create_resp.json()["id"]

        # Retrieve
        response = admin_client.get(f"{ADMIN_PAGES_URL}{page_id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == page_id
        assert "sections" in data
        assert len(data["sections"]) == 1
        assert "blocks" in data["sections"][0]

    def test_list_pages(self, admin_client: APIClient):
        """GET /api/admin/pages/ → 200 with paginated list."""
        # Create two pages
        admin_client.post(
            ADMIN_PAGES_URL,
            data=_valid_page_payload(slug_fa="ص-۱", slug_en="page-1"),
            format="json",
        )
        admin_client.post(
            ADMIN_PAGES_URL,
            data=_valid_page_payload(slug_fa="ص-۲", slug_en="page-2"),
            format="json",
        )

        response = admin_client.get(ADMIN_PAGES_URL)
        assert response.status_code == 200
        data = response.json()
        # Paginated responses have results key
        assert "results" in data
        assert len(data["results"]) == 2

    def test_update_page_with_version(self, admin_client: APIClient):
        """PUT /api/admin/pages/{id}/ with correct version → 200."""
        # Create
        payload = _valid_page_payload()
        create_resp = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")
        page_id = create_resp.json()["id"]
        version = create_resp.json()["version"]

        # Update with correct version
        update_payload = _valid_page_payload(
            title_en="Updated Title",
            version=version,
        )
        response = admin_client.put(
            f"{ADMIN_PAGES_URL}{page_id}/", data=update_payload, format="json"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title_en"] == "Updated Title"
        # Version should have been incremented
        assert data["version"] == version + 1

    def test_create_page_accepts_every_composer_block_default(self, admin_client: APIClient):
        payload = _valid_page_payload(
            slug_fa="همه-بلاکها",
            slug_en="all-composer-blocks",
            sections=[{
                "ordering": 0,
                "enabled": True,
                "layout": "full-width",
                "blocks": _composer_default_blocks(),
            }],
        )

        response = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")

        assert response.status_code == 201, response.content.decode()
        assert len(response.json()["sections"][0]["blocks"]) == 16


# ===========================================================================
# 2. Admin auth enforcement tests
# ===========================================================================


@pytest.mark.django_db
class TestAdminAuthEnforcement:
    """Admin endpoints must require authentication."""

    def test_unauthenticated_request_returns_403(self, api_client: APIClient):
        """Any admin endpoint without session → 403."""
        response = api_client.get(ADMIN_PAGES_URL)
        assert response.status_code == 403

    def test_unauthenticated_create_returns_403(self, api_client: APIClient):
        """POST to admin endpoint without auth → 403."""
        payload = _valid_page_payload()
        response = api_client.post(ADMIN_PAGES_URL, data=payload, format="json")
        assert response.status_code == 403

    def test_authenticated_request_succeeds(self, admin_client: APIClient):
        """With authenticated user → appropriate 2xx."""
        response = admin_client.get(ADMIN_PAGES_URL)
        assert response.status_code == 200


# ===========================================================================
# 3. Optimistic locking conflict tests
# ===========================================================================


@pytest.mark.django_db(transaction=True)
class TestOptimisticLockingConflict:
    """Optimistic locking returns 409 on version mismatch."""

    def test_update_with_wrong_version_returns_409(self, admin_client: APIClient):
        """PUT with outdated version → 409 Problem Details."""
        # Create page (version=1)
        payload = _valid_page_payload()
        create_resp = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")
        page_id = create_resp.json()["id"]

        # First update succeeds (version=1 → version=2)
        update_payload = _valid_page_payload(title_en="V2 Title", version=1)
        first_update = admin_client.put(
            f"{ADMIN_PAGES_URL}{page_id}/", data=update_payload, format="json"
        )
        assert first_update.status_code == 200

        # Second update with outdated version=1 → should get 409
        stale_payload = _valid_page_payload(title_en="Stale Title", version=1)
        response = admin_client.put(
            f"{ADMIN_PAGES_URL}{page_id}/", data=stale_payload, format="json"
        )
        assert response.status_code == 409

    def test_409_response_includes_current_version(self, admin_client: APIClient):
        """409 response body has current_version in Problem Details."""
        # Create page (version=1)
        payload = _valid_page_payload(slug_fa="ص-تضاد", slug_en="conflict-test")
        create_resp = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")
        page_id = create_resp.json()["id"]

        # Succeed: version 1 → 2
        admin_client.put(
            f"{ADMIN_PAGES_URL}{page_id}/",
            data=_valid_page_payload(
                slug_fa="ص-تضاد", slug_en="conflict-test", title_en="V2", version=1
            ),
            format="json",
        )

        # Conflict: send version=1 again (current is 2)
        response = admin_client.put(
            f"{ADMIN_PAGES_URL}{page_id}/",
            data=_valid_page_payload(
                slug_fa="ص-تضاد", slug_en="conflict-test", title_en="Stale", version=1
            ),
            format="json",
        )
        assert response.status_code == 409
        body = response.json()
        # RFC 7807 Problem Details fields
        assert "status" in body
        assert body["status"] == 409
        assert "title" in body
        assert "detail" in body
        # current_version included as extra data
        assert "current_version" in body
        assert body["current_version"] == 2


# ===========================================================================
# 4. Composition validation error tests
# ===========================================================================


@pytest.mark.django_db
class TestCompositionValidationErrors:
    """Invalid composition payloads return 400 with problem details."""

    def test_create_with_unknown_block_type_returns_400(self, admin_client: APIClient):
        """Invalid block_type → 400."""
        payload = _valid_page_payload(
            slug_fa="ص-نامعتبر",
            slug_en="invalid-block-type",
            sections=[
                {
                    "ordering": 0,
                    "enabled": True,
                    "layout": "default",
                    "blocks": [
                        {
                            "block_type": "nonexistent_widget",
                            "settings": {},
                            "ordering": 0,
                        },
                    ],
                },
            ],
        )
        response = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")
        assert response.status_code in (400, 422)

    def test_create_with_unsafe_url_returns_400(self, admin_client: APIClient):
        """javascript: URL → 400."""
        payload = _valid_page_payload(
            slug_fa="ص-لینک-خطرناک",
            slug_en="unsafe-url",
            sections=[
                {
                    "ordering": 0,
                    "enabled": True,
                    "layout": "default",
                    "blocks": [
                        {
                            "block_type": "hero",
                            "settings": {
                                "title": "Hack",
                                "cta_url": "javascript:alert(1)",
                            },
                            "ordering": 0,
                        },
                    ],
                },
            ],
        )
        response = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")
        assert response.status_code == 400

    def test_create_with_ordering_gap_returns_400(self, admin_client: APIClient):
        """Non-contiguous ordering → 400."""
        payload = _valid_page_payload(
            slug_fa="ص-ترتیب-ناصحیح",
            slug_en="ordering-gap",
            sections=[
                {
                    "ordering": 0,
                    "enabled": True,
                    "layout": "default",
                    "blocks": [
                        {
                            "block_type": "hero",
                            "settings": {"title": "First"},
                            "ordering": 0,
                        },
                        {
                            "block_type": "text",
                            "settings": {"content": "Gap", "alignment": "start"},
                            "ordering": 5,  # gap: 0 then 5
                        },
                    ],
                },
            ],
        )
        response = admin_client.post(ADMIN_PAGES_URL, data=payload, format="json")
        assert response.status_code == 400


# ===========================================================================
# 5. Public endpoint tests
# ===========================================================================


@pytest.mark.django_db
class TestPublicPageEndpoint:
    """Public page endpoint serves published content with proper filtering."""

    def test_public_page_returns_published_only(
        self, api_client: APIClient, published_page
    ):
        """Published page → 200."""
        response = api_client.get(
            f"{PUBLIC_PAGES_URL}{published_page.slug_en}/", {"locale": "en"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["slug_en"] == "published-page"

    def test_public_blocks_resolve_active_media_for_hero_and_gallery(
        self, api_client: APIClient, published_page, settings, tmp_path
    ):
        settings.MEDIA_ROOT = tmp_path
        asset = MediaAsset.objects.create(
            file=SimpleUploadedFile("hero.png", b"png-content", content_type="image/png"),
            original_filename="hero.png",
            mime_type="image/png",
            file_size=11,
            checksum="a" * 64,
            alt_text_fa="تصویر معرفی",
            alt_text_en="Introduction image",
            caption_fa="شرح فارسی",
            caption_en="English caption",
            status="active",
        )
        section = published_page.sections.filter(enabled=True).first()
        hero = section.blocks.get(block_type="hero")
        hero.settings = {"title": "Hello", "media_id": str(asset.id)}
        hero.save(update_fields=["settings"])
        Block.objects.create(
            section=section,
            block_type="gallery",
            settings={"media_ids": [str(asset.id)], "layout": "grid"},
            ordering=1,
        )

        response = api_client.get(
            f"{PUBLIC_PAGES_URL}{published_page.slug_en}/", {"locale": "en"}
        )

        blocks = response.json()["sections"][0]["blocks"]
        assert blocks[0]["settings"]["media_url"].endswith(asset.file.url)
        assert blocks[0]["settings"]["media_alt"] == "Introduction image"
        item = blocks[1]["settings"]["items"][0]
        assert item["media_id"] == str(asset.id)
        assert item["url"].endswith(asset.file.url)
        assert item["alt"] == "Introduction image"
        assert item["caption"] == "English caption"

    def test_public_home_uses_page_type_instead_of_a_locale_slug(
        self, api_client: APIClient, db
    ):
        """The locale root must work when Home has different locale slugs."""
        home = Page.objects.create(
            slug_fa="صفحه-نخست",
            slug_en="landing-page",
            title_fa="خانه",
            title_en="Home",
            page_type="home",
            status="published",
        )

        response = api_client.get(f"{PUBLIC_PAGES_URL}home/", {"locale": "fa"})

        assert response.status_code == 200
        assert response.json()["slug_fa"] == home.slug_fa

    def test_persian_route_can_resolve_a_canonical_english_page_slug(
        self, api_client: APIClient, db
    ):
        """Static /fa routes use canonical paths without losing Persian content."""
        about = Page.objects.create(
            slug_fa="درباره-من",
            slug_en="about",
            title_fa="درباره من",
            title_en="About",
            page_type="about",
            status="published",
        )

        response = api_client.get(f"{PUBLIC_PAGES_URL}about/", {"locale": "fa"})

        assert response.status_code == 200
        assert response.json()["id"] == str(about.id)
        assert response.json()["title_fa"] == "درباره من"

    def test_public_home_renders_legacy_localized_blocks_in_requested_locale(
        self, api_client: APIClient, db
    ):
        """Removing legacy localization would make published Home blank again."""
        home = Page.objects.create(
            slug_fa="خانه-نمونه",
            slug_en="sample-home",
            title_fa="خانه",
            title_en="Home",
            page_type="home",
            status="published",
        )
        section = Section.objects.create(
            page=home, ordering=0, enabled=True, layout="hero"
        )
        Block.objects.create(
            section=section,
            block_type="hero",
            settings={
                "heading_fa": "عنوان فارسی",
                "heading_en": "English heading",
                "subheading_fa": "زیرعنوان فارسی",
                "subheading_en": "English subheading",
                "cta_text_fa": "بیشتر بدانید",
                "cta_text_en": "Learn more",
                "cta_link": "/about",
            },
            ordering=0,
        )
        Block.objects.create(
            section=section,
            block_type="text",
            settings={
                "body_fa": "متن فارسی",
                "body_en": "English body",
            },
            ordering=1,
        )

        fa_response = api_client.get(f"{PUBLIC_PAGES_URL}home/", {"locale": "fa"})
        en_response = api_client.get(f"{PUBLIC_PAGES_URL}home/", {"locale": "en"})

        assert fa_response.status_code == 200
        fa_blocks = fa_response.json()["sections"][0]["blocks"]
        assert [(block["block_type"], block["ordering"]) for block in fa_blocks] == [
            ("hero", 0),
            ("text", 1),
        ]
        assert fa_blocks[0]["settings"] == {
            "title": "عنوان فارسی",
            "subtitle": "زیرعنوان فارسی",
            "cta_label": "بیشتر بدانید",
            "cta_url": "/about",
        }
        assert fa_blocks[1]["settings"] == {"content": "متن فارسی", "alignment": "start"}

        en_blocks = en_response.json()["sections"][0]["blocks"]
        assert en_blocks[0]["settings"]["title"] == "English heading"
        assert en_blocks[1]["settings"]["content"] == "English body"

    def test_admin_can_save_registered_legacy_localized_blocks(
        self, admin_client: APIClient, db
    ):
        """Rejecting these stored legacy blocks makes the editor unable to save."""
        page = Page.objects.create(
            slug_fa="صفحه-قدیمی",
            slug_en="legacy-page",
            title_fa="صفحه قدیمی",
            title_en="Legacy page",
            page_type="custom",
            status="draft",
        )
        section = Section.objects.create(
            page=page, ordering=0, enabled=True, layout="hero"
        )
        legacy_settings = {
            "heading_fa": "عنوان فارسی",
            "heading_en": "English heading",
            "subheading_fa": "زیرعنوان فارسی",
            "subheading_en": "English subheading",
            "cta_text_fa": "بیشتر بدانید",
            "cta_text_en": "Learn more",
            "cta_link": "/about",
        }
        Block.objects.create(
            section=section,
            block_type="hero",
            settings=legacy_settings,
            ordering=0,
        )

        response = admin_client.put(
            f"{ADMIN_PAGES_URL}{page.id}/",
            {
                "slug_fa": page.slug_fa,
                "slug_en": page.slug_en,
                "title_fa": page.title_fa,
                "title_en": page.title_en,
                "page_type": page.page_type,
                "status": page.status,
                "version": page.version,
                "sections": [{
                    "ordering": 0,
                    "enabled": True,
                    "layout": "hero",
                    "blocks": [{
                        "block_type": "hero",
                        "settings": legacy_settings,
                        "ordering": 0,
                    }],
                }],
            },
            format="json",
        )

        assert response.status_code == 200
        assert response.json()["sections"][0]["blocks"][0]["settings"] == legacy_settings

    def test_public_page_returns_404_for_draft(self, api_client: APIClient, db):
        """Draft page → 404."""
        Page.objects.create(
            slug_fa="ص-پیش‌نویس",
            slug_en="draft-page",
            title_fa="پیش‌نویس",
            title_en="Draft Page",
            page_type="custom",
            status="draft",
        )
        response = api_client.get(f"{PUBLIC_PAGES_URL}draft-page/", {"locale": "en"})
        assert response.status_code == 404

    def test_public_page_excludes_disabled_sections(
        self, api_client: APIClient, published_page
    ):
        """Only enabled sections in response."""
        response = api_client.get(
            f"{PUBLIC_PAGES_URL}{published_page.slug_en}/", {"locale": "en"}
        )
        assert response.status_code == 200
        data = response.json()
        # The page has 3 sections: 2 enabled, 1 disabled
        # Only enabled sections appear
        assert len(data["sections"]) == 2
        # Verify no disabled section ordering=1 is present
        orderings = [s["ordering"] for s in data["sections"]]
        assert 1 not in orderings  # ordering=1 is the disabled section

    def test_public_page_excludes_unknown_blocks(
        self, api_client: APIClient, published_page
    ):
        """Fail-closed filtering removes unknown block_types from response."""
        response = api_client.get(
            f"{PUBLIC_PAGES_URL}{published_page.slug_en}/", {"locale": "en"}
        )
        assert response.status_code == 200
        data = response.json()
        # Collect all block_types from the response
        all_block_types = []
        for section in data["sections"]:
            for block in section["blocks"]:
                all_block_types.append(block["block_type"])
        # "future_widget_v99" must NOT appear
        assert "future_widget_v99" not in all_block_types
        # Known types should be present
        assert "hero" in all_block_types
        assert "text" in all_block_types
