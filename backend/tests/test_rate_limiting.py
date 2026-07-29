"""Tests for rate limiting on login, upload, and public API endpoints.

Requirements: 3.7, 12.5
"""

import pytest
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    """Clear the cache before each test to reset throttle counters."""
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestLoginRateThrottle:
    """Login endpoint is rate-limited to 5 requests per minute."""

    def test_login_under_limit_succeeds(self, api_client: APIClient):
        """Requests below the limit should not be throttled."""
        for _ in range(5):
            response = api_client.post(
                "/api/admin/login/",
                {"username": "nobody", "password": "wrong"},
                format="json",
            )
            # 401 because credentials are wrong, not 429
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": [
                "rest_framework.authentication.SessionAuthentication",
            ],
            "DEFAULT_PERMISSION_CLASSES": [
                "rest_framework.permissions.IsAuthenticated",
            ],
            "DEFAULT_RENDERER_CLASSES": [
                "rest_framework.renderers.JSONRenderer",
            ],
            "DEFAULT_PARSER_CLASSES": [
                "rest_framework.parsers.JSONParser",
                "rest_framework.parsers.MultiPartParser",
                "rest_framework.parsers.FormParser",
            ],
            "DEFAULT_THROTTLE_CLASSES": [
                "apps.core.throttling.PublicAnonRateThrottle",
                "apps.core.throttling.PublicUserRateThrottle",
            ],
            "DEFAULT_THROTTLE_RATES": {
                "login": "3/min",
                "upload": "20/min",
                "public_anon": "100/min",
                "public_user": "1000/min",
            },
            "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.DefaultPageNumberPagination",
            "PAGE_SIZE": 20,
            "EXCEPTION_HANDLER": "apps.core.exceptions.problem_detail_exception_handler",
        }
    )
    def test_login_over_limit_returns_429(self, api_client: APIClient):
        """Requests exceeding the limit should be throttled with 429."""
        # Make 3 requests (the limit for this test)
        for _ in range(3):
            api_client.post(
                "/api/admin/login/",
                {"username": "nobody", "password": "wrong"},
                format="json",
            )

        # 4th request should be throttled
        response = api_client.post(
            "/api/admin/login/",
            {"username": "nobody", "password": "wrong"},
            format="json",
        )
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    def test_login_success_with_valid_credentials(
        self, api_client: APIClient, admin_user
    ):
        """Valid credentials should authenticate and create a session."""
        response = api_client.post(
            "/api/admin/login/",
            {"username": "admin", "password": "adminpass123!"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "authenticated"
        assert response.data["user"] == "admin"


@pytest.mark.django_db
class TestUploadRateThrottle:
    """Upload endpoint is rate-limited to 20 requests per minute."""

    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": [
                "rest_framework.authentication.SessionAuthentication",
            ],
            "DEFAULT_PERMISSION_CLASSES": [
                "rest_framework.permissions.IsAuthenticated",
            ],
            "DEFAULT_RENDERER_CLASSES": [
                "rest_framework.renderers.JSONRenderer",
            ],
            "DEFAULT_PARSER_CLASSES": [
                "rest_framework.parsers.JSONParser",
                "rest_framework.parsers.MultiPartParser",
                "rest_framework.parsers.FormParser",
            ],
            "DEFAULT_THROTTLE_CLASSES": [
                "apps.core.throttling.PublicAnonRateThrottle",
                "apps.core.throttling.PublicUserRateThrottle",
            ],
            "DEFAULT_THROTTLE_RATES": {
                "login": "5/min",
                "upload": "2/min",
                "public_anon": "100/min",
                "public_user": "1000/min",
            },
            "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.DefaultPageNumberPagination",
            "PAGE_SIZE": 20,
            "EXCEPTION_HANDLER": "apps.core.exceptions.problem_detail_exception_handler",
        }
    )
    def test_upload_over_limit_returns_429(self, admin_client: APIClient):
        """Upload requests exceeding the limit should be throttled."""
        from io import BytesIO

        from django.core.files.uploadedfile import SimpleUploadedFile

        # Make 2 upload requests (the limit for this test)
        for _ in range(2):
            file = SimpleUploadedFile(
                "test.png",
                b"\x89PNG\r\n\x1a\n" + b"\x00" * 100,
                content_type="image/png",
            )
            admin_client.post(
                "/api/admin/media/upload/",
                {"file": file},
                format="multipart",
            )

        # 3rd request should be throttled
        file = SimpleUploadedFile(
            "test.png",
            b"\x89PNG\r\n\x1a\n" + b"\x00" * 100,
            content_type="image/png",
        )
        response = admin_client.post(
            "/api/admin/media/upload/",
            {"file": file},
            format="multipart",
        )
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.django_db
class TestPublicApiRateThrottle:
    """Public API endpoints are rate-limited (100/min anon, 1000/min auth)."""

    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": [
                "rest_framework.authentication.SessionAuthentication",
            ],
            "DEFAULT_PERMISSION_CLASSES": [
                "rest_framework.permissions.IsAuthenticated",
            ],
            "DEFAULT_RENDERER_CLASSES": [
                "rest_framework.renderers.JSONRenderer",
            ],
            "DEFAULT_PARSER_CLASSES": [
                "rest_framework.parsers.JSONParser",
                "rest_framework.parsers.MultiPartParser",
                "rest_framework.parsers.FormParser",
            ],
            "DEFAULT_THROTTLE_CLASSES": [
                "apps.core.throttling.PublicAnonRateThrottle",
                "apps.core.throttling.PublicUserRateThrottle",
            ],
            "DEFAULT_THROTTLE_RATES": {
                "login": "5/min",
                "upload": "20/min",
                "public_anon": "3/min",
                "public_user": "1000/min",
            },
            "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.DefaultPageNumberPagination",
            "PAGE_SIZE": 20,
            "EXCEPTION_HANDLER": "apps.core.exceptions.problem_detail_exception_handler",
        }
    )
    def test_public_anon_over_limit_returns_429(self, api_client: APIClient):
        """Anonymous public API requests exceeding limit are throttled."""
        # Make 3 requests (the limit for this test)
        for _ in range(3):
            api_client.get("/api/public/health/")

        # 4th request should be throttled
        response = api_client.get("/api/public/health/")
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    def test_public_health_endpoint_works(self, api_client: APIClient):
        """Public health endpoint returns 200 under normal conditions."""
        response = api_client.get("/api/public/health/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"


@pytest.mark.django_db
class TestSessionLogout:
    """Session logout endpoint."""

    def test_logout_clears_session(self, admin_client: APIClient):
        """Logout endpoint clears the session."""
        response = admin_client.post("/api/admin/logout/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "logged_out"

    def test_logout_requires_auth(self, api_client: APIClient):
        """Logout requires an authenticated session."""
        response = api_client.post("/api/admin/logout/")
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
