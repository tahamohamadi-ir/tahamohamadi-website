"""Tests for audit event creation on workflow state transitions.

Requirement 8.10: Record an audit event for every state transition with user,
timestamp, and reason.
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType

from apps.workflow.models import AuditEvent
from apps.workflow.services import create_audit_event

User = get_user_model()


@pytest.mark.django_db
class TestCreateAuditEvent:
    """Integration tests for create_audit_event service function."""

    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            username="editor",
            password="testpass123",
        )

    @pytest.fixture
    def page(self):
        from apps.cms.models import Page

        return Page.objects.create(
            slug_fa="تست-ادیت",
            slug_en="audit-test",
            title_fa="تست آدیت",
            title_en="Audit Test",
            page_type="custom",
            status="draft",
        )

    def test_creates_audit_event_with_all_fields(self, page, user):
        """create_audit_event stores from_status, to_status, user, and reason."""
        event = create_audit_event(
            entity=page,
            from_status="draft",
            to_status="published",
            user=user,
            reason="Content is ready for publishing",
        )

        assert event.pk is not None
        assert event.from_status == "draft"
        assert event.to_status == "published"
        assert event.user == user
        assert event.reason == "Content is ready for publishing"
        assert event.timestamp is not None

    def test_content_type_and_object_id_set_correctly(self, page, user):
        """AuditEvent references the correct entity via GenericForeignKey."""
        event = create_audit_event(
            entity=page,
            from_status="draft",
            to_status="in_review",
            user=user,
        )

        expected_ct = ContentType.objects.get_for_model(page)
        assert event.content_type == expected_ct
        assert event.object_id == page.pk

    def test_user_can_be_none_for_system_transitions(self, page):
        """System-initiated transitions (e.g., scheduled publish) may have no user."""
        event = create_audit_event(
            entity=page,
            from_status="scheduled",
            to_status="published",
            user=None,
            reason="Scheduled publish job executed",
        )

        assert event.user is None
        assert event.from_status == "scheduled"
        assert event.to_status == "published"

    def test_reason_defaults_to_empty_string(self, page, user):
        """When no reason is provided, it defaults to empty string."""
        event = create_audit_event(
            entity=page,
            from_status="published",
            to_status="archived",
            user=user,
        )

        assert event.reason == ""

    def test_persisted_to_database(self, page, user):
        """The audit event is actually saved to the database."""
        event = create_audit_event(
            entity=page,
            from_status="draft",
            to_status="in_review",
            user=user,
            reason="Submitting for review",
        )

        from_db = AuditEvent.objects.get(pk=event.pk)
        assert from_db.from_status == "draft"
        assert from_db.to_status == "in_review"
        assert from_db.user == user
        assert from_db.reason == "Submitting for review"

    def test_multiple_events_for_same_entity(self, page, user):
        """Multiple transitions on the same entity each create separate events."""
        create_audit_event(
            entity=page,
            from_status="draft",
            to_status="in_review",
            user=user,
        )
        create_audit_event(
            entity=page,
            from_status="in_review",
            to_status="published",
            user=user,
            reason="Approved by editor",
        )

        ct = ContentType.objects.get_for_model(page)
        events = AuditEvent.objects.filter(
            content_type=ct, object_id=page.pk
        )
        assert events.count() == 2

    def test_works_with_article_entity(self, user):
        """create_audit_event works with any model (Article)."""
        from apps.blog.models import Article

        article = Article.objects.create(
            slug_fa="مقاله-تست",
            slug_en="test-article",
            title_fa="مقاله تست",
            title_en="Test Article",
            status="draft",
        )

        event = create_audit_event(
            entity=article,
            from_status="draft",
            to_status="published",
            user=user,
        )

        expected_ct = ContentType.objects.get_for_model(article)
        assert event.content_type == expected_ct
        assert event.object_id == article.pk
