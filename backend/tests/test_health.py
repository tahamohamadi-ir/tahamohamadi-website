"""
Health endpoint smoke tests (pytest-style).

Verifies the public and admin health endpoints respond correctly without
requiring a database connection (uses Django's SimpleTestCase-compatible
approach via pytest-django).
"""

import pytest
from django.urls import reverse
from rest_framework import status


class TestPublicHealthEndpoint:
    """Public health endpoint should be accessible without authentication."""

    def test_returns_200_ok(self, api_client):
        url = reverse("api:core-public:health")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_reports_ok_status(self, api_client):
        url = reverse("api:core-public:health")
        response = api_client.get(url)
        body = response.json()

        assert body["status"] == "ok"

    def test_reports_supported_locales(self, api_client):
        url = reverse("api:core-public:health")
        response = api_client.get(url)
        body = response.json()

        assert body["locales"] == ["fa", "en"]


class TestAdminHealthEndpoint:
    """Admin health endpoint should require authentication."""

    def test_returns_403_without_auth(self, api_client):
        url = reverse("api:core-admin:health")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_returns_problem_json_content_type(self, api_client):
        url = reverse("api:core-admin:health")
        response = api_client.get(url)

        assert "application/problem+json" in response.headers["Content-Type"]

    @pytest.mark.django_db
    def test_returns_200_with_admin_auth(self, admin_client):
        url = reverse("api:core-admin:health")
        response = admin_client.get(url)

        assert response.status_code == status.HTTP_200_OK
