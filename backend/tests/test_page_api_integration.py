"""Integration tests for page composition API endpoints (task 2.9).

Tests the full HTTP round-trip for admin CRUD, public projection,
authentication enforcement, optimistic locking conflicts, and
composition validation errors.

All tests require PostgreSQL (marked with @pytest.mark.django_db).
Conflict tests use transaction=True for real DB transaction behaviour.
"""

import pytest
from rest_framework.test import APIClient

from apps.cms.models import Block, Page, Section


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
