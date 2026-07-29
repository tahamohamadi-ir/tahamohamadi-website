"""Tests for Cache-Control middleware.

Validates Requirement 13.4: Cache-Control headers per route type.

- Public API: CDN-cacheable headers
- Admin API: no-cache, no-store, must-revalidate
- Preview: no-store with X-Robots-Tag: noindex
- Media: immutable with long max-age
"""

import pytest
from django.test import RequestFactory

from apps.core.middleware import CacheControlMiddleware


@pytest.fixture
def middleware():
    """Create middleware instance with a dummy get_response."""

    def get_response(request):
        from django.http import HttpResponse

        return HttpResponse("OK")

    return CacheControlMiddleware(get_response)


@pytest.fixture
def rf():
    return RequestFactory()


class TestPublicAPICaching:
    """Public API should return CDN-cacheable headers."""

    def test_public_api_cache_control(self, middleware, rf):
        request = rf.get("/api/public/pages/")
        response = middleware(request)

        assert response["Cache-Control"] == "public, s-maxage=3600, stale-while-revalidate=86400"

    def test_public_blog_cache_control(self, middleware, rf):
        request = rf.get("/api/public/blog/articles/")
        response = middleware(request)

        assert response["Cache-Control"] == "public, s-maxage=3600, stale-while-revalidate=86400"

    def test_public_portfolio_cache_control(self, middleware, rf):
        request = rf.get("/api/public/portfolio/")
        response = middleware(request)

        assert response["Cache-Control"] == "public, s-maxage=3600, stale-while-revalidate=86400"


class TestAdminAPICaching:
    """Admin API should never be cached."""

    def test_admin_api_no_cache(self, middleware, rf):
        request = rf.get("/api/admin/pages/")
        response = middleware(request)

        assert response["Cache-Control"] == "no-cache, no-store, must-revalidate"

    def test_admin_media_no_cache(self, middleware, rf):
        request = rf.get("/api/admin/media/")
        response = middleware(request)

        assert response["Cache-Control"] == "no-cache, no-store, must-revalidate"

    def test_admin_workflow_no_cache(self, middleware, rf):
        request = rf.post("/api/admin/workflow/transition/")
        response = middleware(request)

        assert response["Cache-Control"] == "no-cache, no-store, must-revalidate"


class TestPreviewCaching:
    """Preview responses must have no-store and X-Robots-Tag: noindex."""

    def test_preview_no_store(self, middleware, rf):
        request = rf.get("/api/public/workflow/preview/?token=abc123")
        response = middleware(request)

        assert response["Cache-Control"] == "no-store"

    def test_preview_x_robots_tag(self, middleware, rf):
        request = rf.get("/api/public/workflow/preview/?token=abc123")
        response = middleware(request)

        assert response["X-Robots-Tag"] == "noindex"

    def test_preview_takes_precedence_over_public(self, middleware, rf):
        """Preview path is under /api/public/ but should get no-store, not public caching."""
        request = rf.get("/api/public/workflow/preview/")
        response = middleware(request)

        assert "s-maxage" not in response.get("Cache-Control", "")
        assert response["Cache-Control"] == "no-store"


class TestMediaCaching:
    """Media files should be immutable with long max-age."""

    def test_media_immutable(self, middleware, rf):
        request = rf.get("/media/uploads/abc123-image.webp")
        response = middleware(request)

        assert response["Cache-Control"] == "public, max-age=31536000, immutable"


class TestExplicitCacheControlPreserved:
    """If a view already sets Cache-Control, middleware should not override."""

    def test_existing_header_preserved(self, rf):
        def get_response(request):
            from django.http import HttpResponse

            resp = HttpResponse("OK")
            resp["Cache-Control"] = "private, max-age=60"
            return resp

        mw = CacheControlMiddleware(get_response)
        request = rf.get("/api/public/pages/")
        response = mw(request)

        # Should keep the view's explicit header, not override
        assert response["Cache-Control"] == "private, max-age=60"
