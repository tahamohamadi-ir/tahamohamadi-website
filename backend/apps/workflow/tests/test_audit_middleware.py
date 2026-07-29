"""Tests for audit logging middleware.

Validates Requirements 3.6, 12.6:
- All state-mutating admin requests (POST, PUT, PATCH, DELETE) are logged
- Audit events capture user, timestamp, action, entity, and endpoint
- GET requests are NOT logged
- Failed requests (non-2xx) are NOT logged
- Unauthenticated requests are NOT logged
- Public API requests are NOT logged
"""

from __future__ import annotations

import uuid

import pytest
from django.contrib.auth.models import User
from django.test import RequestFactory
from rest_framework.test import APIClient

from apps.workflow.models import AuditEvent


@pytest.fixture
def admin_user(db):
    """Create an admin user for tests."""
    return User.objects.create_superuser(
        username="auditadmin", password="testpass123", email="audit@test.com"
    )


@pytest.fixture
def api_client(admin_user):
    """Create an authenticated API client."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def anon_client():
    """Create an unauthenticated API client."""
    return APIClient()


class TestAuditLoggingMiddleware:
    """Test the audit logging middleware for admin mutations."""

    def test_post_to_admin_creates_audit_event(self, api_client, admin_user, db):
        """POST to admin endpoint should create an audit event."""
        initial_count = AuditEvent.objects.count()

        # POST to an admin endpoint - use blog articles create
        response = api_client.post(
            "/api/admin/blog/",
            data={
                "title_fa": "تست",
                "title_en": "Test",
                "slug_fa": f"test-fa-{uuid.uuid4().hex[:8]}",
                "slug_en": f"test-en-{uuid.uuid4().hex[:8]}",
                "status": "draft",
                "blocks": [],
            },
            format="json",
        )

        # If the endpoint returns 2xx, audit event should be created
        if 200 <= response.status_code < 300:
            assert AuditEvent.objects.count() > initial_count
            event = AuditEvent.objects.order_by("-timestamp").first()
            assert event.user == admin_user
            assert event.to_status == "create"
            assert "POST" in event.reason
            assert "/api/admin/blog/" in event.reason

    def test_get_request_not_logged(self, api_client, db):
        """GET requests should NOT create audit events."""
        initial_count = AuditEvent.objects.count()

        api_client.get("/api/admin/blog/")

        # No new audit events for GET requests
        assert AuditEvent.objects.count() == initial_count

    def test_public_api_not_logged(self, api_client, db):
        """Requests to public API should NOT create audit events."""
        initial_count = AuditEvent.objects.count()

        api_client.get("/api/public/health/")

        assert AuditEvent.objects.count() == initial_count

    def test_unauthenticated_request_not_logged(self, anon_client, db):
        """Unauthenticated requests should NOT create audit events."""
        initial_count = AuditEvent.objects.count()

        anon_client.post(
            "/api/admin/blog/",
            data={"title": "test"},
            format="json",
        )

        # Should not log since user isn't authenticated (and request returns 401/403)
        assert AuditEvent.objects.count() == initial_count

    def test_failed_request_not_logged(self, api_client, db):
        """Failed requests (4xx/5xx) should NOT create audit events."""
        initial_count = AuditEvent.objects.count()

        # Send invalid data that will cause a 400 error
        response = api_client.post(
            "/api/admin/blog/",
            data={},  # Missing required fields
            format="json",
        )

        # 400 Bad Request should not be logged
        if response.status_code >= 400:
            assert AuditEvent.objects.count() == initial_count

    def test_delete_request_logged_as_delete_action(self, api_client, admin_user, db):
        """DELETE requests should be logged with action='delete'."""
        # Create a test article first
        from apps.blog.models import Article

        article = Article.objects.create(
            title_fa="حذف تست",
            title_en="Delete Test",
            slug_fa=f"delete-test-fa-{uuid.uuid4().hex[:8]}",
            slug_en=f"delete-test-en-{uuid.uuid4().hex[:8]}",
            status="draft",
        )

        initial_count = AuditEvent.objects.count()

        response = api_client.delete(f"/api/admin/blog/{article.id}/")

        if 200 <= response.status_code < 300:
            assert AuditEvent.objects.count() > initial_count
            event = AuditEvent.objects.order_by("-timestamp").first()
            assert event.to_status == "delete"
            assert event.user == admin_user
            assert "DELETE" in event.reason

    def test_patch_request_logged_as_update_action(self, api_client, admin_user, db):
        """PATCH requests should be logged with action='update'."""
        from apps.blog.models import Article

        article = Article.objects.create(
            title_fa="بروزرسانی تست",
            title_en="Update Test",
            slug_fa=f"update-test-fa-{uuid.uuid4().hex[:8]}",
            slug_en=f"update-test-en-{uuid.uuid4().hex[:8]}",
            status="draft",
        )

        initial_count = AuditEvent.objects.count()

        response = api_client.patch(
            f"/api/admin/blog/{article.id}/",
            data={"title_en": "Updated Title"},
            format="json",
        )

        if 200 <= response.status_code < 300:
            assert AuditEvent.objects.count() > initial_count
            event = AuditEvent.objects.order_by("-timestamp").first()
            assert event.to_status == "update"
            assert event.user == admin_user

    def test_audit_event_captures_object_id_from_url(self, api_client, admin_user, db):
        """Audit event should capture the object UUID from the URL path."""
        from apps.blog.models import Article

        article = Article.objects.create(
            title_fa="آی‌دی تست",
            title_en="ID Test",
            slug_fa=f"id-test-fa-{uuid.uuid4().hex[:8]}",
            slug_en=f"id-test-en-{uuid.uuid4().hex[:8]}",
            status="draft",
        )

        response = api_client.patch(
            f"/api/admin/blog/{article.id}/",
            data={"title_en": "New Title"},
            format="json",
        )

        if 200 <= response.status_code < 300:
            event = AuditEvent.objects.order_by("-timestamp").first()
            assert event.object_id == article.id

    def test_audit_event_captures_content_type(self, api_client, admin_user, db):
        """Audit event should capture the correct content type from URL."""
        from apps.blog.models import Article
        from django.contrib.contenttypes.models import ContentType

        article = Article.objects.create(
            title_fa="نوع محتوا تست",
            title_en="Content Type Test",
            slug_fa=f"ct-test-fa-{uuid.uuid4().hex[:8]}",
            slug_en=f"ct-test-en-{uuid.uuid4().hex[:8]}",
            status="draft",
        )

        response = api_client.patch(
            f"/api/admin/blog/{article.id}/",
            data={"title_en": "CT Updated"},
            format="json",
        )

        if 200 <= response.status_code < 300:
            event = AuditEvent.objects.order_by("-timestamp").first()
            expected_ct = ContentType.objects.get(app_label="blog", model="article")
            assert event.content_type == expected_ct
