"""
Root conftest for the backend test suite.

Provides shared fixtures for API testing with DRF's APIClient, including
authenticated user and admin user variants. pytest-django handles the test
database lifecycle via its `django_db_setup` fixture.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture()
def api_client() -> APIClient:
    """Unauthenticated DRF APIClient."""
    return APIClient()


@pytest.fixture()
def user(db) -> "User":
    """A regular active user (no staff/superuser privileges)."""
    return User.objects.create_user(
        username="testuser",
        email="testuser@example.com",
        password="testpass123!",
    )


@pytest.fixture()
def admin_user(db) -> "User":
    """A staff + superuser for admin API access."""
    return User.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password="adminpass123!",
    )


@pytest.fixture()
def authenticated_client(api_client: APIClient, user) -> APIClient:
    """APIClient authenticated as a regular user via session."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture()
def admin_client(api_client: APIClient, admin_user) -> APIClient:
    """APIClient authenticated as a staff/superuser via session."""
    api_client.force_authenticate(user=admin_user)
    return api_client
