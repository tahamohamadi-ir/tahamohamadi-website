"""Integration tests for page composition API endpoints (task 2.9).

Covers admin CRUD, public endpoint projections, optimistic locking,
validation errors, and authentication enforcement.

**Validates: Requirements 15.2, 15.3**
"""

import uuid

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.blog.models import Article
from apps.cms.models import Block, Page, Section
from apps.identity.models import ResearchProject
from apps.portfolio.models import CaseStudy

User = get_user_model()
COLLECTION_RAW_FIELDS = {"id", "status", "technologies", "topics", "featured_image"}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="admin_test",
        password="testpass123",
        is_staff=True,
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authed_client(api_client, admin_user):
    """APIClient with force_authenticate for admin endpoints."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def valid_page_payload():
    """Minimal valid page creation payload with one section and one block."""
    return {
        "slug_fa": "صفحه-تست",
        "slug_en": "test-page",
        "title_fa": "صفحه تست",
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
                        "ordering": 0,
                        "settings": {"title": "Welcome"},
                    }
                ],
            }
        ],
    }


@pytest.fixture
def published_page(db):
    """A published page with one enabled section and one valid block."""
    page = Page.objects.create(
        slug_fa="منتشر-شده",
        slug_en="published-page",
        title_fa="صفحه منتشر شده",
        title_en="Published Page",
        page_type="custom",
        status="published",
    )
    section = Section.objects.create(
        page=page, ordering=0, enabled=True, layout="default"
    )
    Block.objects.create(
        section=section,
        block_type="text",
        ordering=0,
        settings={"content": "Hello world", "alignment": "start"},
    )
    return page


# ---------------------------------------------------------------------------
# 1. Admin CRUD
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAdminCreatePage:
    """Admin page creation via POST /api/admin/pages/."""

    def test_create_page_valid_composition_201(self, authed_client, valid_page_payload):
        """Create page with valid composition returns 201."""
        resp = authed_client.post(
            "/api/admin/pages/", valid_page_payload, format="json"
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["slug_en"] == "test-page"
        assert data["version"] == 1
        assert len(data["sections"]) == 1
        assert len(data["sections"][0]["blocks"]) == 1

    def test_create_page_invalid_block_type_400(self, authed_client, valid_page_payload):
        """Create page with unknown block_type returns 400 or 422 Problem Details."""
        valid_page_payload["sections"][0]["blocks"][0]["block_type"] = "nonexistent"
        resp = authed_client.post(
            "/api/admin/pages/", valid_page_payload, format="json"
        )
        assert resp.status_code in (400, 422)
        data = resp.json()
        assert data["status"] in (400, 422)
        # Check it's either Problem Details or DRF validation error
        assert "type" in data or "block_type" in str(data)
        assert "block_type" in str(data.get("errors", data.get("detail", data)))

    def test_create_page_invalid_settings_400(self, authed_client, valid_page_payload):
        """Create page where block settings fail schema validation returns 400."""
        # hero requires 'title' in settings
        valid_page_payload["sections"][0]["blocks"][0]["settings"] = {
            "unknown_key": "bad"
        }
        resp = authed_client.post(
            "/api/admin/pages/", valid_page_payload, format="json"
        )
        assert resp.status_code in (400, 422)


@pytest.mark.django_db
class TestAdminRetrievePage:
    """Admin page retrieval via GET /api/admin/pages/{id}/."""

    def test_retrieve_page_200(self, authed_client, valid_page_payload):
        """Retrieve page returns 200 with full sections/blocks."""
        create_resp = authed_client.post(
            "/api/admin/pages/", valid_page_payload, format="json"
        )
        page_id = create_resp.json()["id"]

        resp = authed_client.get(f"/api/admin/pages/{page_id}/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == page_id
        assert "sections" in data
        assert len(data["sections"]) == 1
        assert len(data["sections"][0]["blocks"]) == 1


@pytest.mark.django_db
class TestAdminListPages:
    """Admin page listing via GET /api/admin/pages/."""

    def test_list_pages_200(self, authed_client, valid_page_payload):
        """List pages returns 200 with lightweight serializer (no nested sections)."""
        authed_client.post("/api/admin/pages/", valid_page_payload, format="json")

        resp = authed_client.get("/api/admin/pages/")
        assert resp.status_code == 200
        data = resp.json()
        # DRF default is a list (or paginated); check at least one item
        results = data if isinstance(data, list) else data.get("results", data)
        assert len(results) >= 1
        # List serializer should NOT include sections
        assert "sections" not in results[0]


@pytest.mark.django_db
class TestAdminUpdatePage:
    """Admin page update with optimistic locking."""

    def _create_page(self, authed_client, valid_page_payload):
        resp = authed_client.post(
            "/api/admin/pages/", valid_page_payload, format="json"
        )
        return resp.json()

    def test_update_with_correct_version_200(
        self, authed_client, valid_page_payload
    ):
        """Update page with correct version returns 200 and version is incremented."""
        page_data = self._create_page(authed_client, valid_page_payload)
        page_id = page_data["id"]
        current_version = page_data["version"]

        update_payload = valid_page_payload.copy()
        update_payload["title_en"] = "Updated Title"
        update_payload["version"] = current_version

        resp = authed_client.put(
            f"/api/admin/pages/{page_id}/", update_payload, format="json"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title_en"] == "Updated Title"
        assert data["version"] == current_version + 1

    def test_update_with_wrong_version_409(
        self, authed_client, valid_page_payload
    ):
        """Update page with wrong version returns 409 Conflict."""
        page_data = self._create_page(authed_client, valid_page_payload)
        page_id = page_data["id"]

        update_payload = valid_page_payload.copy()
        update_payload["version"] = 999  # wrong version

        resp = authed_client.put(
            f"/api/admin/pages/{page_id}/", update_payload, format="json"
        )
        assert resp.status_code == 409
        data = resp.json()
        assert data["status"] == 409

    def test_update_missing_version_400(
        self, authed_client, valid_page_payload
    ):
        """Update page without version field returns 400."""
        page_data = self._create_page(authed_client, valid_page_payload)
        page_id = page_data["id"]

        # Payload without version
        update_payload = valid_page_payload.copy()
        # Ensure 'version' is not present
        update_payload.pop("version", None)

        resp = authed_client.put(
            f"/api/admin/pages/{page_id}/", update_payload, format="json"
        )
        assert resp.status_code == 400
        data = resp.json()
        assert data["status"] == 400


@pytest.mark.django_db
class TestAdminDeletePage:
    """Admin page deletion via DELETE /api/admin/pages/{id}/."""

    def test_delete_page_204(self, authed_client, valid_page_payload):
        """Delete page returns 204 and page is removed."""
        create_resp = authed_client.post(
            "/api/admin/pages/", valid_page_payload, format="json"
        )
        page_id = create_resp.json()["id"]

        resp = authed_client.delete(f"/api/admin/pages/{page_id}/")
        assert resp.status_code == 204

        # Confirm it's gone
        resp = authed_client.get(f"/api/admin/pages/{page_id}/")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 2. Public endpoint
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicPageEndpoint:
    """Public page endpoint: GET /api/public/pages/<slug>/."""

    def test_published_page_200(self, api_client, published_page):
        """Published page returns 200 with full projection."""
        resp = api_client.get(f"/api/public/pages/{published_page.slug_en}/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug_en"] == "published-page"
        assert "sections" in data
        assert len(data["sections"]) >= 1

    def test_draft_page_404(self, api_client, db):
        """Draft page returns 404."""
        Page.objects.create(
            slug_fa="پیش-نویس",
            slug_en="draft-page",
            title_fa="پیش نویس",
            title_en="Draft Page",
            page_type="custom",
            status="draft",
        )
        resp = api_client.get("/api/public/pages/draft-page/")
        assert resp.status_code == 404

    def test_nonexistent_slug_404(self, api_client, db):
        """Non-existent slug returns 404."""
        resp = api_client.get("/api/public/pages/does-not-exist/")
        assert resp.status_code == 404

    def test_disabled_sections_excluded(self, api_client, db):
        """Disabled sections are excluded from the public response."""
        page = Page.objects.create(
            slug_fa="بخش-غیرفعال",
            slug_en="disabled-section-test",
            title_fa="تست بخش غیرفعال",
            title_en="Disabled Section Test",
            page_type="custom",
            status="published",
        )
        # Enabled section
        enabled = Section.objects.create(
            page=page, ordering=0, enabled=True, layout="default"
        )
        Block.objects.create(
            section=enabled,
            block_type="text",
            ordering=0,
            settings={"content": "Visible", "alignment": "start"},
        )
        # Disabled section
        disabled = Section.objects.create(
            page=page, ordering=1, enabled=False, layout="default"
        )
        Block.objects.create(
            section=disabled,
            block_type="text",
            ordering=0,
            settings={"content": "Hidden", "alignment": "start"},
        )

        resp = api_client.get("/api/public/pages/disabled-section-test/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["sections"]) == 1
        assert data["sections"][0]["blocks"][0]["settings"]["content"] == "Visible"

    def test_unknown_block_types_excluded(self, api_client, db):
        """Unknown block types are excluded from public response (fail-closed)."""
        page = Page.objects.create(
            slug_fa="بلاک-ناشناخته",
            slug_en="unknown-block-test",
            title_fa="تست بلاک ناشناخته",
            title_en="Unknown Block Test",
            page_type="custom",
            status="published",
        )
        section = Section.objects.create(
            page=page, ordering=0, enabled=True, layout="default"
        )
        # Valid block
        Block.objects.create(
            section=section,
            block_type="text",
            ordering=0,
            settings={"content": "Valid", "alignment": "start"},
        )
        # Unknown block type (manually inserted, bypasses serializer validation)
        Block.objects.create(
            section=section,
            block_type="totally_unknown_type",
            ordering=1,
            settings={"foo": "bar"},
        )

        resp = api_client.get("/api/public/pages/unknown-block-test/")
        assert resp.status_code == 200
        data = resp.json()
        blocks = data["sections"][0]["blocks"]
        # Only the valid block should be present
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "text"

    def test_locale_fa_matches_slug_fa(self, api_client, db):
        """locale=fa matches slug_fa."""
        Page.objects.create(
            slug_fa="صفحه-فارسی",
            slug_en="farsi-page",
            title_fa="صفحه فارسی",
            title_en="Farsi Page",
            page_type="custom",
            status="published",
        )
        resp = api_client.get("/api/public/pages/صفحه-فارسی/?locale=fa")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug_fa"] == "صفحه-فارسی"

    def test_locale_en_matches_slug_en(self, api_client, published_page):
        """locale=en (default) matches slug_en."""
        resp = api_client.get(
            f"/api/public/pages/{published_page.slug_en}/?locale=en"
        )
        assert resp.status_code == 200
        assert resp.json()["slug_en"] == published_page.slug_en

    def test_collection_block_resolves_published_identity_without_ids(self, api_client, db):
        page = Page.objects.create(
            slug_fa="مجموعه", slug_en="identity-collection", title_fa="مجموعه", title_en="Collection",
            page_type="custom", status="published",
        )
        section = Section.objects.create(page=page, ordering=0, enabled=True)
        Block.objects.create(
            section=section, block_type="collection", ordering=0,
            settings={"source": "research_projects", "filter": {"featured": True}, "limit": 3, "order": "newest"},
        )
        ResearchProject.objects.create(
            slug_fa="پژوهش", slug_en="research", title_fa="پژوهش", title_en="Published research",
            featured=True, status="published",
        )
        ResearchProject.objects.create(
            slug_fa="پیش‌نویس", slug_en="draft", title_fa="پیش‌نویس", title_en="Draft research",
            featured=True, status="draft",
        )

        response = api_client.get("/api/public/pages/identity-collection/?locale=en")

        assert response.status_code == 200
        items = response.json()["sections"][0]["blocks"][0]["settings"]["items"]
        assert items == [{
            "slug_fa": "پژوهش", "slug_en": "research", "title": "Published research",
            "summary": "", "methodology": "", "featured": True, "published_at": None,
        }]
        assert "id" not in items[0]

    def test_collection_block_resolves_blog_and_portfolio_without_raw_fields(self, api_client, db):
        page = Page.objects.create(
            slug_fa="مجموعه-محتوا", slug_en="content-collections", title_fa="مجموعه", title_en="Collections",
            page_type="custom", status="published",
        )
        section = Section.objects.create(page=page, ordering=0, enabled=True)
        Block.objects.create(
            section=section, block_type="collection", ordering=0,
            settings={"source": "portfolio", "filter": {"featured": True}, "limit": 2, "order": "newest"},
        )
        Block.objects.create(
            section=section, block_type="collection", ordering=1,
            settings={"source": "posts", "filter": {}, "limit": 2, "order": "newest"},
        )
        CaseStudy.objects.create(
            slug_fa="نمونه", slug_en="case-study", title_fa="نمونه منتشرشده", title_en="Published case study",
            technologies=["django"], featured=True, status="published",
        )
        CaseStudy.objects.create(
            slug_fa="پیش‌نویس", slug_en="draft-case-study", title_fa="پیش‌نویس", title_en="Draft case study",
            technologies=[], featured=True, status="draft",
        )
        Article.objects.create(
            slug_fa="مقاله", slug_en="article", title_fa="مقاله منتشرشده", title_en="Published article",
            excerpt_en="A public excerpt", status="published",
        )
        Article.objects.create(
            slug_fa="پیش‌نویس-مقاله", slug_en="draft-article", title_fa="پیش‌نویس", title_en="Draft article",
            status="draft",
        )

        response = api_client.get("/api/public/pages/content-collections/?locale=en")

        assert response.status_code == 200
        portfolio_items = response.json()["sections"][0]["blocks"][0]["settings"]["items"]
        post_items = response.json()["sections"][0]["blocks"][1]["settings"]["items"]
        assert [item["slug_en"] for item in portfolio_items] == ["case-study"]
        assert [item["slug_en"] for item in post_items] == ["article"]
        assert portfolio_items[0]["title_en"] == "Published case study"
        assert post_items[0]["excerpt_en"] == "A public excerpt"
        assert not (COLLECTION_RAW_FIELDS & portfolio_items[0].keys())
        assert not (COLLECTION_RAW_FIELDS & post_items[0].keys())


# ---------------------------------------------------------------------------
# 3. Auth enforcement
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAuthEnforcement:
    """Unauthenticated requests to admin endpoints are rejected."""

    def test_unauthenticated_admin_request_returns_401_or_403(self, api_client, db):
        """Unauthenticated request to admin endpoint returns 401 or 403."""
        resp = api_client.get("/api/admin/pages/")
        assert resp.status_code in (401, 403)
