"""Integration tests for portfolio API endpoints (task 5.5).

Covers admin CRUD, public endpoint projections, locale-filtered narrative
blocks, gallery management, technology/featured filtering, and authentication
enforcement.

**Validates: Requirements 15.1, 15.2**
"""

import uuid

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from apps.media.models import MediaAsset
from apps.portfolio.models import CaseStudy, CaseStudyBlock

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="portfolio_admin",
        email="portfolio_admin@example.com",
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
def media_assets(db):
    """Two media assets for gallery testing."""
    asset1 = MediaAsset.objects.create(
        original_filename="gallery1.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        checksum="a" * 64,
        file="media/2024/01/gallery1.jpg",
    )
    asset2 = MediaAsset.objects.create(
        original_filename="gallery2.png",
        mime_type="image/png",
        file_size=2048,
        checksum="b" * 64,
        file="media/2024/01/gallery2.png",
    )
    return asset1, asset2


@pytest.fixture
def valid_case_study_payload():
    """Minimal valid case study creation payload with narrative blocks."""
    return {
        "slug_fa": "پروژه-تست",
        "slug_en": "test-project",
        "title_fa": "پروژه تست",
        "title_en": "Test Project",
        "role_fa": "توسعه‌دهنده",
        "role_en": "Developer",
        "client_fa": "مشتری تست",
        "client_en": "Test Client",
        "technologies": ["Python", "Django", "React"],
        "status": "draft",
        "featured": False,
        "narrative_blocks": [
            {
                "locale": "en",
                "block_type": "text",
                "content": {"body": "English intro paragraph"},
                "ordering": 0,
            },
            {
                "locale": "fa",
                "block_type": "text",
                "content": {"body": "پاراگراف مقدمه فارسی"},
                "ordering": 0,
            },
        ],
    }


@pytest.fixture
def published_case_study(db):
    """A published case study with narrative blocks in both locales."""
    cs = CaseStudy.objects.create(
        slug_fa="منتشر-شده",
        slug_en="published-project",
        title_fa="پروژه منتشر شده",
        title_en="Published Project",
        role_fa="طراح",
        role_en="Designer",
        client_fa="مشتری",
        client_en="Client",
        technologies=["React", "TypeScript"],
        status="published",
        featured=True,
        published_at=timezone.now(),
    )
    CaseStudyBlock.objects.create(
        case_study=cs,
        locale="en",
        block_type="text",
        content={"body": "English content"},
        ordering=0,
    )
    CaseStudyBlock.objects.create(
        case_study=cs,
        locale="fa",
        block_type="text",
        content={"body": "محتوای فارسی"},
        ordering=0,
    )
    return cs


@pytest.fixture
def draft_case_study(db):
    """A draft case study (should not appear in public endpoints)."""
    return CaseStudy.objects.create(
        slug_fa="پیش-نویس",
        slug_en="draft-project",
        title_fa="پروژه پیش نویس",
        title_en="Draft Project",
        technologies=["Vue"],
        status="draft",
        featured=False,
    )


# ---------------------------------------------------------------------------
# 1. Admin CRUD
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAdminCreateCaseStudy:
    """Admin case study creation via POST /api/admin/portfolio/."""

    def test_create_case_study_201(self, authed_client, valid_case_study_payload):
        """Create case study with valid payload returns 201."""
        resp = authed_client.post(
            "/api/admin/portfolio/", valid_case_study_payload, format="json"
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["slug_en"] == "test-project"
        assert data["version"] == 1
        assert len(data["narrative_blocks"]) == 2
        assert data["technologies"] == ["Python", "Django", "React"]


@pytest.mark.django_db
class TestAdminRetrieveCaseStudy:
    """Admin case study retrieval via GET /api/admin/portfolio/{id}/."""

    def test_retrieve_with_narrative_blocks_200(
        self, authed_client, valid_case_study_payload
    ):
        """Retrieve case study returns 200 with narrative blocks."""
        create_resp = authed_client.post(
            "/api/admin/portfolio/", valid_case_study_payload, format="json"
        )
        cs_id = create_resp.json()["id"]

        resp = authed_client.get(f"/api/admin/portfolio/{cs_id}/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == cs_id
        assert "narrative_blocks" in data
        assert len(data["narrative_blocks"]) == 2


@pytest.mark.django_db
class TestAdminListCaseStudies:
    """Admin case study listing via GET /api/admin/portfolio/."""

    def test_list_lightweight_200(self, authed_client, valid_case_study_payload):
        """List case studies returns 200 without nested narrative_blocks."""
        authed_client.post(
            "/api/admin/portfolio/", valid_case_study_payload, format="json"
        )

        resp = authed_client.get("/api/admin/portfolio/")
        assert resp.status_code == 200
        data = resp.json()
        results = data if isinstance(data, list) else data.get("results", data)
        assert len(results) >= 1
        # List serializer should NOT include narrative_blocks
        assert "narrative_blocks" not in results[0]


@pytest.mark.django_db
class TestAdminUpdateCaseStudy:
    """Admin case study update with optimistic locking."""

    def _create(self, authed_client, payload):
        resp = authed_client.post(
            "/api/admin/portfolio/", payload, format="json"
        )
        return resp.json()

    def test_update_with_correct_version_200(
        self, authed_client, valid_case_study_payload
    ):
        """Update with correct version returns 200 and version is incremented."""
        cs_data = self._create(authed_client, valid_case_study_payload)
        cs_id = cs_data["id"]
        current_version = cs_data["version"]

        update_payload = valid_case_study_payload.copy()
        update_payload["title_en"] = "Updated Title"
        update_payload["version"] = current_version

        resp = authed_client.put(
            f"/api/admin/portfolio/{cs_id}/", update_payload, format="json"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title_en"] == "Updated Title"
        assert data["version"] == current_version + 1

    def test_update_with_wrong_version_409(
        self, authed_client, valid_case_study_payload
    ):
        """Update with wrong version returns 409 Conflict."""
        cs_data = self._create(authed_client, valid_case_study_payload)
        cs_id = cs_data["id"]

        update_payload = valid_case_study_payload.copy()
        update_payload["version"] = 999  # wrong version

        resp = authed_client.put(
            f"/api/admin/portfolio/{cs_id}/", update_payload, format="json"
        )
        assert resp.status_code == 409


@pytest.mark.django_db
class TestAdminDeleteCaseStudy:
    """Admin case study deletion via DELETE /api/admin/portfolio/{id}/."""

    def test_delete_204(self, authed_client, valid_case_study_payload):
        """Delete case study returns 204."""
        create_resp = authed_client.post(
            "/api/admin/portfolio/", valid_case_study_payload, format="json"
        )
        cs_id = create_resp.json()["id"]

        resp = authed_client.delete(f"/api/admin/portfolio/{cs_id}/")
        assert resp.status_code == 204

        # Confirm it's gone
        resp = authed_client.get(f"/api/admin/portfolio/{cs_id}/")
        assert resp.status_code == 404


@pytest.mark.django_db
class TestAdminGalleryManagement:
    """Admin gallery management via POST /api/admin/portfolio/{id}/manage-gallery/."""

    def test_add_gallery_items(
        self, authed_client, valid_case_study_payload, media_assets
    ):
        """Add gallery items returns 200 with updated gallery."""
        create_resp = authed_client.post(
            "/api/admin/portfolio/", valid_case_study_payload, format="json"
        )
        cs_id = create_resp.json()["id"]
        asset1, asset2 = media_assets

        resp = authed_client.post(
            f"/api/admin/portfolio/{cs_id}/manage-gallery/",
            {"add": [str(asset1.id), str(asset2.id)]},
            format="json",
        )
        assert resp.status_code == 200
        gallery_ids = [str(g) for g in resp.json()["gallery"]]
        assert str(asset1.id) in gallery_ids
        assert str(asset2.id) in gallery_ids

    def test_remove_gallery_items(
        self, authed_client, valid_case_study_payload, media_assets
    ):
        """Remove gallery items returns 200 with updated gallery."""
        asset1, asset2 = media_assets
        # Create with gallery
        payload = valid_case_study_payload.copy()
        payload["gallery"] = [str(asset1.id), str(asset2.id)]
        create_resp = authed_client.post(
            "/api/admin/portfolio/", payload, format="json"
        )
        cs_id = create_resp.json()["id"]

        # Remove one asset
        resp = authed_client.post(
            f"/api/admin/portfolio/{cs_id}/manage-gallery/",
            {"remove": [str(asset1.id)]},
            format="json",
        )
        assert resp.status_code == 200
        gallery_ids = [str(g) for g in resp.json()["gallery"]]
        assert str(asset1.id) not in gallery_ids
        assert str(asset2.id) in gallery_ids


# ---------------------------------------------------------------------------
# 2. Public Endpoints
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicCaseStudyDetail:
    """Public case study detail: GET /api/public/portfolio/<slug>/."""

    def test_published_by_slug_200(self, api_client, published_case_study):
        """Published case study by slug returns 200."""
        resp = api_client.get(
            f"/api/public/portfolio/{published_case_study.slug_en}/"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug_en"] == "published-project"
        assert "narrative_blocks" in data

    def test_draft_case_study_404(self, api_client, draft_case_study):
        """Draft case study returns 404."""
        resp = api_client.get(
            f"/api/public/portfolio/{draft_case_study.slug_en}/"
        )
        assert resp.status_code == 404

    def test_nonexistent_slug_404(self, api_client, db):
        """Non-existent slug returns 404."""
        resp = api_client.get("/api/public/portfolio/does-not-exist/")
        assert resp.status_code == 404

    def test_locale_filtering_narrative_blocks(
        self, api_client, published_case_study
    ):
        """Narrative blocks are filtered by locale — only target locale returned."""
        # English locale (default)
        resp_en = api_client.get(
            f"/api/public/portfolio/{published_case_study.slug_en}/?locale=en"
        )
        assert resp_en.status_code == 200
        blocks_en = resp_en.json()["narrative_blocks"]
        assert len(blocks_en) == 1
        assert blocks_en[0]["locale"] == "en"
        assert blocks_en[0]["content"]["body"] == "English content"

        # Farsi locale
        resp_fa = api_client.get(
            f"/api/public/portfolio/{published_case_study.slug_fa}/?locale=fa"
        )
        assert resp_fa.status_code == 200
        blocks_fa = resp_fa.json()["narrative_blocks"]
        assert len(blocks_fa) == 1
        assert blocks_fa[0]["locale"] == "fa"
        assert blocks_fa[0]["content"]["body"] == "محتوای فارسی"


@pytest.mark.django_db
class TestPublicCaseStudyList:
    """Public case study list: GET /api/public/portfolio/."""

    def test_list_only_published(
        self, api_client, published_case_study, draft_case_study
    ):
        """List only shows published case studies."""
        resp = api_client.get("/api/public/portfolio/")
        assert resp.status_code == 200
        data = resp.json()
        results = data if isinstance(data, list) else data.get("results", data)
        slugs = [r["slug_en"] for r in results]
        assert "published-project" in slugs
        assert "draft-project" not in slugs

    def test_filter_by_featured(self, api_client, published_case_study, db):
        """Filter by featured=true returns only featured case studies."""
        # Create a non-featured published case study
        CaseStudy.objects.create(
            slug_fa="غیر-برجسته",
            slug_en="not-featured",
            title_fa="غیر برجسته",
            title_en="Not Featured",
            technologies=["Python"],
            status="published",
            featured=False,
            published_at=timezone.now(),
        )

        resp = api_client.get("/api/public/portfolio/?featured=true")
        assert resp.status_code == 200
        data = resp.json()
        results = data if isinstance(data, list) else data.get("results", data)
        # Only the featured published case study should be returned
        for r in results:
            assert r["featured"] is True
        assert any(r["slug_en"] == "published-project" for r in results)

    def test_filter_by_technologies(self, api_client, published_case_study, db):
        """Filter by technologies returns correctly filtered results."""
        # published_case_study has ["React", "TypeScript"]
        # Create another with different technologies
        CaseStudy.objects.create(
            slug_fa="پایتون-پروژه",
            slug_en="python-project",
            title_fa="پروژه پایتون",
            title_en="Python Project",
            technologies=["Python", "Django"],
            status="published",
            featured=False,
            published_at=timezone.now(),
        )

        # Filter by React — should return published_case_study only
        resp = api_client.get("/api/public/portfolio/?technologies=React")
        assert resp.status_code == 200
        data = resp.json()
        results = data if isinstance(data, list) else data.get("results", data)
        slugs = [r["slug_en"] for r in results]
        assert "published-project" in slugs
        assert "python-project" not in slugs


# ---------------------------------------------------------------------------
# 3. Auth Enforcement
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPortfolioAuthEnforcement:
    """Unauthenticated requests to admin portfolio endpoints are rejected."""

    def test_unauthenticated_admin_request_returns_401_or_403(self, api_client, db):
        """Unauthenticated request to admin endpoint returns 401 or 403."""
        resp = api_client.get("/api/admin/portfolio/")
        assert resp.status_code in (401, 403)
