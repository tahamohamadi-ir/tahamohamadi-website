"""Tests for revision snapshot creation, listing, comparison, and restore.

Validates Requirements 8.4 and 8.5:
- create_revision creates an immutable snapshot using DRF serializer
- list_revisions returns all revisions for an entity
- compare_revisions returns field-level diff between two snapshots
- restore_revision creates a new draft entity (never overwrites)
"""

from __future__ import annotations

import pytest
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType

from apps.blog.models import Article, ArticleBlock, Topic
from apps.cms.models import Block, Page, Section
from apps.workflow.models import Revision
from apps.workflow.services import (
    compare_revisions,
    create_revision,
    list_revisions,
    restore_revision,
)


@pytest.fixture
def admin_user(db):
    """Create an admin user for tests."""
    return User.objects.create_superuser(
        username="admin", password="testpass", email="admin@test.com"
    )


@pytest.fixture
def page_with_content(db):
    """Create a Page with sections and blocks for snapshot testing."""
    page = Page.objects.create(
        slug_fa="صفحه-تست",
        slug_en="test-page",
        title_fa="صفحه تست",
        title_en="Test Page",
        page_type="custom",
        status="published",
        created_by="admin",
        updated_by="admin",
    )
    section = Section.objects.create(
        page=page, ordering=1, enabled=True, layout="full-width"
    )
    Block.objects.create(
        section=section,
        block_type="hero",
        settings={"title": "Hello", "subtitle": "World"},
        ordering=1,
    )
    Block.objects.create(
        section=section,
        block_type="text",
        settings={"content": "Some text content", "alignment": "start"},
        ordering=2,
    )
    return page


@pytest.fixture
def article_with_blocks(db):
    """Create an Article with blocks for snapshot testing."""
    article = Article.objects.create(
        slug_fa="مقاله-تست",
        slug_en="test-article",
        title_fa="مقاله تست",
        title_en="Test Article",
        excerpt_fa="خلاصه فارسی",
        excerpt_en="English excerpt",
        status="published",
        reading_time_fa=5,
        reading_time_en=4,
        created_by="admin",
        updated_by="admin",
    )
    ArticleBlock.objects.create(
        article=article,
        locale="en",
        block_type="paragraph",
        content={"text": "Hello world"},
        ordering=1,
    )
    ArticleBlock.objects.create(
        article=article,
        locale="fa",
        block_type="paragraph",
        content={"text": "سلام دنیا"},
        ordering=1,
    )
    return article


# ---------------------------------------------------------------------------
# create_revision tests
# ---------------------------------------------------------------------------


class TestCreateRevision:
    """Test immutable revision snapshot creation."""

    def test_creates_revision_for_page(self, page_with_content):
        revision = create_revision(page_with_content, label="Test snapshot")

        assert revision.pk is not None
        assert revision.label == "Test snapshot"
        assert revision.object_id == page_with_content.pk
        assert revision.snapshot is not None
        assert revision.snapshot["title_en"] == "Test Page"
        assert revision.snapshot["slug_en"] == "test-page"
        assert revision.snapshot["status"] == "published"

    def test_snapshot_includes_nested_sections_and_blocks(self, page_with_content):
        revision = create_revision(page_with_content)

        sections = revision.snapshot.get("sections", [])
        assert len(sections) == 1
        assert sections[0]["ordering"] == 1
        assert sections[0]["layout"] == "full-width"

        blocks = sections[0].get("blocks", [])
        assert len(blocks) == 2
        assert blocks[0]["block_type"] == "hero"
        assert blocks[0]["settings"]["title"] == "Hello"
        assert blocks[1]["block_type"] == "text"

    def test_creates_revision_for_article(self, article_with_blocks):
        revision = create_revision(article_with_blocks, label="Article v1")

        assert revision.snapshot["title_en"] == "Test Article"
        assert revision.snapshot["excerpt_fa"] == "خلاصه فارسی"
        # DRF serializer includes blocks
        blocks = revision.snapshot.get("blocks", [])
        assert len(blocks) == 2

    def test_revisions_are_immutable_different_snapshots(self, page_with_content):
        """Creating a revision, then modifying entity, should yield different snapshots."""
        rev1 = create_revision(page_with_content, label="Before edit")

        page_with_content.title_en = "Modified Title"
        page_with_content.save()

        rev2 = create_revision(page_with_content, label="After edit")

        assert rev1.snapshot["title_en"] == "Test Page"
        assert rev2.snapshot["title_en"] == "Modified Title"
        assert rev1.pk != rev2.pk

    def test_revision_stores_created_by(self, page_with_content):
        revision = create_revision(page_with_content, user="editor_user")
        assert revision.created_by == "editor_user"

    def test_raises_for_unknown_model(self, db):
        """Should raise ValueError for unsupported model types."""
        user = User.objects.create_user(
            username="testuser", password="pass", email="t@t.com"
        )
        with pytest.raises(ValueError, match="No serializer registered"):
            create_revision(user, label="shouldn't work")


# ---------------------------------------------------------------------------
# list_revisions tests
# ---------------------------------------------------------------------------


class TestListRevisions:
    """Test revision listing for an entity."""

    def test_returns_revisions_for_entity(self, page_with_content):
        ct = ContentType.objects.get_for_model(page_with_content)
        create_revision(page_with_content, label="Rev 1")
        create_revision(page_with_content, label="Rev 2")

        revisions = list_revisions(ct, page_with_content.pk)
        assert revisions.count() == 2
        labels = list(revisions.values_list("label", flat=True))
        # Default ordering is -created_at (newest first)
        assert "Rev 2" in labels
        assert "Rev 1" in labels

    def test_does_not_return_other_entity_revisions(self, page_with_content, article_with_blocks):
        ct_page = ContentType.objects.get_for_model(page_with_content)
        create_revision(page_with_content, label="Page rev")
        create_revision(article_with_blocks, label="Article rev")

        page_revisions = list_revisions(ct_page, page_with_content.pk)
        assert page_revisions.count() == 1
        assert page_revisions.first().label == "Page rev"

    def test_empty_when_no_revisions(self, page_with_content):
        ct = ContentType.objects.get_for_model(page_with_content)
        revisions = list_revisions(ct, page_with_content.pk)
        assert revisions.count() == 0


# ---------------------------------------------------------------------------
# compare_revisions tests
# ---------------------------------------------------------------------------


class TestCompareRevisions:
    """Test comparison between two revision snapshots."""

    def test_detects_changed_fields(self, page_with_content):
        rev1 = create_revision(page_with_content, label="V1")

        page_with_content.title_en = "New Title"
        page_with_content.save()
        rev2 = create_revision(page_with_content, label="V2")

        diff = compare_revisions(rev1.pk, rev2.pk)

        assert "title_en" in diff["changed"]
        assert diff["changed"]["title_en"]["old"] == "Test Page"
        assert diff["changed"]["title_en"]["new"] == "New Title"

    def test_detects_unchanged_fields(self, page_with_content):
        rev1 = create_revision(page_with_content, label="V1")
        rev2 = create_revision(page_with_content, label="V2")

        diff = compare_revisions(rev1.pk, rev2.pk)

        # Same snapshot → all fields unchanged (except potentially updated_at)
        assert len(diff["changed"]) == 0 or "updated_at" in diff["changed"]
        assert "title_en" in diff["unchanged"]

    def test_returns_correct_structure(self, page_with_content):
        rev1 = create_revision(page_with_content, label="V1")
        rev2 = create_revision(page_with_content, label="V2")

        diff = compare_revisions(rev1.pk, rev2.pk)

        assert "revision_a" in diff
        assert "revision_b" in diff
        assert "added" in diff
        assert "removed" in diff
        assert "changed" in diff
        assert "unchanged" in diff
        assert diff["revision_a"] == rev1.pk
        assert diff["revision_b"] == rev2.pk

    def test_raises_for_invalid_revision_id(self, db):
        import uuid

        fake_id = uuid.uuid4()
        with pytest.raises(Revision.DoesNotExist):
            compare_revisions(fake_id, fake_id)


# ---------------------------------------------------------------------------
# restore_revision tests
# ---------------------------------------------------------------------------


class TestRestoreRevision:
    """Test that restore creates a new draft entity, never overwrites."""

    def test_restore_page_creates_new_draft(self, page_with_content, admin_user):
        revision = create_revision(page_with_content, label="Snapshot")

        new_page = restore_revision(revision.pk, admin_user)

        # New entity with different PK
        assert new_page.pk != page_with_content.pk
        # Status is draft, version is 1
        assert new_page.status == "draft"
        assert new_page.version == 1
        # Created by restoring user
        assert new_page.created_by == "admin"
        assert new_page.updated_by == "admin"
        # Content matches snapshot
        assert new_page.title_en == "Test Page"
        assert new_page.title_fa == "صفحه تست"
        assert new_page.page_type == "custom"

    def test_restore_page_deduplicates_slugs(self, page_with_content, admin_user):
        revision = create_revision(page_with_content, label="Snapshot")

        new_page = restore_revision(revision.pk, admin_user)

        # Slugs should be different from original
        assert new_page.slug_en != page_with_content.slug_en
        assert "restored" in new_page.slug_en
        assert new_page.slug_fa != page_with_content.slug_fa
        assert "restored" in new_page.slug_fa

    def test_restore_page_recreates_sections_and_blocks(self, page_with_content, admin_user):
        revision = create_revision(page_with_content, label="Snapshot")

        new_page = restore_revision(revision.pk, admin_user)

        sections = new_page.sections.all()
        assert sections.count() == 1
        assert sections.first().ordering == 1
        assert sections.first().layout == "full-width"

        blocks = sections.first().blocks.all()
        assert blocks.count() == 2
        assert blocks[0].block_type == "hero"
        assert blocks[0].settings["title"] == "Hello"

    def test_restore_page_rejects_historical_raw_html_before_creating_a_draft(
        self, page_with_content, admin_user
    ):
        unsafe_block = page_with_content.sections.get().blocks.get(block_type="text")
        unsafe_block.settings = {
            "content": '<img src=x onerror="alert(1)">',
            "alignment": "start",
        }
        unsafe_block.save(update_fields=["settings"])
        revision = create_revision(page_with_content, label="Historical unsafe snapshot")
        page_count = Page.objects.count()

        with pytest.raises(ValueError, match="raw HTML"):
            restore_revision(revision.pk, admin_user)

        assert Page.objects.count() == page_count

    def test_restore_article_creates_new_draft(self, article_with_blocks, admin_user):
        revision = create_revision(article_with_blocks, label="Article snap")

        new_article = restore_revision(revision.pk, admin_user)

        assert new_article.pk != article_with_blocks.pk
        assert new_article.status == "draft"
        assert new_article.version == 1
        assert new_article.title_en == "Test Article"
        assert new_article.excerpt_fa == "خلاصه فارسی"
        assert new_article.reading_time_fa == 5

    def test_restore_article_recreates_blocks(self, article_with_blocks, admin_user):
        revision = create_revision(article_with_blocks, label="Article snap")

        new_article = restore_revision(revision.pk, admin_user)

        blocks = new_article.blocks.all()
        assert blocks.count() == 2
        # Check both locales are restored
        en_blocks = blocks.filter(locale="en")
        fa_blocks = blocks.filter(locale="fa")
        assert en_blocks.count() == 1
        assert fa_blocks.count() == 1
        assert en_blocks.first().content == {"text": "Hello world"}

    def test_restore_does_not_modify_original(self, page_with_content, admin_user):
        revision = create_revision(page_with_content, label="Snapshot")
        original_pk = page_with_content.pk
        original_status = page_with_content.status

        restore_revision(revision.pk, admin_user)

        # Reload original from DB
        page_with_content.refresh_from_db()
        assert page_with_content.pk == original_pk
        assert page_with_content.status == original_status

    def test_restore_multiple_times_creates_unique_slugs(self, page_with_content, admin_user):
        revision = create_revision(page_with_content, label="Snapshot")

        page_a = restore_revision(revision.pk, admin_user)
        page_b = restore_revision(revision.pk, admin_user)

        # Both should have unique slugs
        assert page_a.slug_en != page_b.slug_en
        assert page_a.pk != page_b.pk

    def test_restore_raises_for_invalid_revision(self, admin_user, db):
        import uuid

        with pytest.raises(Revision.DoesNotExist):
            restore_revision(uuid.uuid4(), admin_user)

    def test_restore_article_with_topics(self, article_with_blocks, admin_user, db):
        """Topics referenced in snapshot are restored via M2M."""
        topic = Topic.objects.create(
            slug="python", name_fa="پایتون", name_en="Python"
        )
        article_with_blocks.topics.add(topic)

        revision = create_revision(article_with_blocks, label="With topics")
        new_article = restore_revision(revision.pk, admin_user)

        assert new_article.topics.count() == 1
        assert new_article.topics.first().slug == "python"
