"""Tests for blog public API endpoints (public-only-published behavior).

Validates that:
- Only published articles are visible on the public API.
- Draft and archived articles return 404.
- The list endpoint only shows published articles.
- Locale filtering works (fa slug → fa blocks, en slug → en blocks).
- TOC data is present in the detail response.
- Related articles are present in the detail response.

**Validates: Requirements 15.1, 15.2, 15.3**
"""

import pytest
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.test import APIClient

from apps.blog.models import Article, ArticleBlock, Topic
from apps.media.models import MediaAsset


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def topic(db):
    """A topic to associate with articles."""
    return Topic.objects.create(
        slug="python",
        name_fa="پایتون",
        name_en="Python",
    )


@pytest.fixture
def published_article(db, topic):
    """A published article with blocks in both locales."""
    article = Article.objects.create(
        slug_fa="مقاله-منتشر-شده",
        slug_en="published-article",
        title_fa="مقاله منتشر شده",
        title_en="Published Article",
        excerpt_fa="خلاصه فارسی",
        excerpt_en="English excerpt",
        status="published",
        published_at=timezone.now(),
        reading_time_fa=3,
        reading_time_en=2,
    )
    article.topics.add(topic)

    # English blocks
    ArticleBlock.objects.create(
        article=article,
        locale="en",
        block_type="heading",
        content={"text": "Introduction", "level": 2},
        ordering=0,
    )
    ArticleBlock.objects.create(
        article=article,
        locale="en",
        block_type="paragraph",
        content={"text": "This is a published article."},
        ordering=1,
    )
    # Persian blocks
    ArticleBlock.objects.create(
        article=article,
        locale="fa",
        block_type="heading",
        content={"text": "مقدمه", "level": 2},
        ordering=0,
    )
    ArticleBlock.objects.create(
        article=article,
        locale="fa",
        block_type="paragraph",
        content={"text": "این یک مقاله منتشر شده است."},
        ordering=1,
    )
    return article


@pytest.fixture
def draft_article(db):
    """A draft article that should NOT appear on the public API."""
    return Article.objects.create(
        slug_fa="پیش-نویس-بلاگ",
        slug_en="draft-blog-article",
        title_fa="پیش نویس",
        title_en="Draft Article",
        status="draft",
    )


@pytest.fixture
def archived_article(db):
    """An archived article that should NOT appear on the public API."""
    return Article.objects.create(
        slug_fa="آرشیو-شده",
        slug_en="archived-article",
        title_fa="آرشیو شده",
        title_en="Archived Article",
        status="archived",
    )


# ---------------------------------------------------------------------------
# Public Article Detail — Published vs Draft/Archived
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicArticleDetailAccess:
    """Public article detail endpoint: only published articles are accessible."""

    def test_published_article_returns_200(self, api_client, published_article):
        """Published article returns 200 with full data."""
        resp = api_client.get("/api/public/blog/articles/published-article/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug_en"] == "published-article"
        assert data["title_en"] == "Published Article"

    def test_draft_article_returns_404(self, api_client, draft_article):
        """Draft article returns 404 on public endpoint."""
        resp = api_client.get("/api/public/blog/articles/draft-blog-article/")
        assert resp.status_code == 404

    def test_archived_article_returns_404(self, api_client, archived_article):
        """Archived article returns 404 on public endpoint."""
        resp = api_client.get("/api/public/blog/articles/archived-article/")
        assert resp.status_code == 404

    def test_nonexistent_slug_returns_404(self, api_client, db):
        """Non-existent slug returns 404."""
        resp = api_client.get("/api/public/blog/articles/does-not-exist/")
        assert resp.status_code == 404

    def test_featured_image_projects_only_while_media_asset_is_active(
        self, api_client, published_article, db
    ):
        featured = MediaAsset.objects.create(
            file="media/2026/08/featured.jpg",
            original_filename="featured.jpg",
            mime_type="image/jpeg",
            file_size=123,
            checksum="f" * 64,
            status="active",
        )
        published_article.featured_image = featured
        published_article.save(update_fields=["featured_image", "updated_at"])

        active_response = api_client.get(
            "/api/public/blog/articles/published-article/"
        )
        assert active_response.json()["featured_image"]["id"] == str(featured.id)

        featured.status = "archived"
        featured.save(update_fields=["status", "updated_at"])

        archived_response = api_client.get(
            "/api/public/blog/articles/published-article/"
        )
        assert archived_response.json()["featured_image"] is None


# ---------------------------------------------------------------------------
# Public Article List — Only Published
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicArticleListFiltering:
    """Public article list endpoint: only published articles are shown."""

    def test_list_shows_only_published(
        self, api_client, published_article, draft_article, archived_article
    ):
        """List returns only published articles, not draft/archived."""
        resp = api_client.get("/api/public/blog/articles/")
        assert resp.status_code == 200
        data = resp.json()
        # Handle paginated or non-paginated response
        results = data if isinstance(data, list) else data.get("results", data)
        slugs = [a["slug_en"] for a in results]
        assert "published-article" in slugs
        assert "draft-blog-article" not in slugs
        assert "archived-article" not in slugs

    def test_list_filters_by_topic(self, api_client, published_article, topic, db):
        """Topic filter returns only articles with that topic."""
        # Create another published article without the topic
        other = Article.objects.create(
            slug_fa="مقاله-دیگر",
            slug_en="other-article",
            title_fa="مقاله دیگر",
            title_en="Other Article",
            status="published",
            published_at=timezone.now(),
        )
        resp = api_client.get(f"/api/public/blog/articles/?topic={topic.slug}")
        assert resp.status_code == 200
        data = resp.json()
        results = data if isinstance(data, list) else data.get("results", data)
        slugs = [a["slug_en"] for a in results]
        assert "published-article" in slugs
        assert "other-article" not in slugs

    def test_list_searches_published_article_fields(
        self, api_client, published_article, draft_article
    ):
        """The q parameter searches public fields without exposing drafts."""
        resp = api_client.get("/api/public/blog/articles/?q=published")

        assert resp.status_code == 200
        data = resp.json()
        results = data if isinstance(data, list) else data.get("results", data)
        slugs = [article["slug_en"] for article in results]
        assert "published-article" in slugs
        assert "draft-blog-article" not in slugs


# ---------------------------------------------------------------------------
# Public Topics
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicTopics:
    """Only topics used by published articles are available publicly."""

    def test_list_returns_topics_for_published_articles(
        self, api_client, published_article, topic, draft_article
    ):
        draft_only_topic = Topic.objects.create(
            slug="draft-only",
            name_fa="فقط پیش نویس",
            name_en="Draft only",
        )
        draft_article.topics.add(draft_only_topic)

        resp = api_client.get("/api/public/blog/topics/")

        assert resp.status_code == 200
        slugs = [item["slug"] for item in resp.json()]
        assert topic.slug in slugs
        assert draft_only_topic.slug not in slugs


# ---------------------------------------------------------------------------
# Locale Filtering (slug lookup + block filtering)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicArticleLocale:
    """Locale-aware slug lookup and block filtering."""

    def test_fa_slug_returns_fa_blocks(self, api_client, published_article):
        """Querying with fa slug + locale=fa returns Persian blocks."""
        resp = api_client.get(
            "/api/public/blog/articles/مقاله-منتشر-شده/?locale=fa"
        )
        assert resp.status_code == 200
        data = resp.json()
        # Blocks should be fa locale
        blocks = data.get("blocks", [])
        assert len(blocks) == 2
        for block in blocks:
            assert block["locale"] == "fa"

    def test_en_slug_returns_en_blocks(self, api_client, published_article):
        """Querying with en slug (default locale) returns English blocks."""
        resp = api_client.get("/api/public/blog/articles/published-article/")
        assert resp.status_code == 200
        data = resp.json()
        blocks = data.get("blocks", [])
        assert len(blocks) == 2
        for block in blocks:
            assert block["locale"] == "en"

    def test_en_slug_with_explicit_locale_en(self, api_client, published_article):
        """Explicit locale=en still works with en slug."""
        resp = api_client.get(
            "/api/public/blog/articles/published-article/?locale=en"
        )
        assert resp.status_code == 200
        data = resp.json()
        blocks = data.get("blocks", [])
        assert len(blocks) == 2
        for block in blocks:
            assert block["locale"] == "en"


# ---------------------------------------------------------------------------
# TOC Data in Detail Response
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicArticleToc:
    """TOC (table of contents) data is included in detail response."""

    def test_toc_present_in_response(self, api_client, published_article):
        """Detail response includes a 'toc' field."""
        resp = api_client.get("/api/public/blog/articles/published-article/")
        assert resp.status_code == 200
        data = resp.json()
        assert "toc" in data

    def test_toc_contains_heading_entries(self, api_client, published_article):
        """TOC entries reflect heading blocks."""
        resp = api_client.get("/api/public/blog/articles/published-article/")
        data = resp.json()
        toc = data["toc"]
        assert isinstance(toc, list)
        assert len(toc) >= 1
        # The heading "Introduction" should appear in TOC
        texts = [entry.get("text", "") for entry in toc]
        assert "Introduction" in texts


# ---------------------------------------------------------------------------
# Related Articles in Detail Response
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPublicArticleRelated:
    """Related articles are included in the detail response."""

    def test_related_present_in_response(self, api_client, published_article):
        """Detail response includes a 'related' field."""
        resp = api_client.get("/api/public/blog/articles/published-article/")
        assert resp.status_code == 200
        data = resp.json()
        assert "related" in data
        assert isinstance(data["related"], list)

    def test_related_shows_same_topic_articles(
        self, api_client, published_article, topic, db
    ):
        """Related articles include other published articles in the same topic."""
        # Create another published article with the same topic
        related = Article.objects.create(
            slug_fa="مقاله-مرتبط",
            slug_en="related-article",
            title_fa="مقاله مرتبط",
            title_en="Related Article",
            status="published",
            published_at=timezone.now(),
        )
        related.topics.add(topic)

        resp = api_client.get("/api/public/blog/articles/published-article/")
        data = resp.json()
        related_slugs = [a["slug_en"] for a in data["related"]]
        assert "related-article" in related_slugs

    def test_related_excludes_draft_articles(
        self, api_client, published_article, topic, db
    ):
        """Related articles exclude drafts even if they share a topic."""
        draft_related = Article.objects.create(
            slug_fa="مقاله-پیش-نویس",
            slug_en="draft-related",
            title_fa="مقاله پیش نویس",
            title_en="Draft Related",
            status="draft",
        )
        draft_related.topics.add(topic)

        resp = api_client.get("/api/public/blog/articles/published-article/")
        data = resp.json()
        related_slugs = [a["slug_en"] for a in data["related"]]
        assert "draft-related" not in related_slugs

    def test_related_excludes_self(self, api_client, published_article):
        """Related articles never include the article itself."""
        resp = api_client.get("/api/public/blog/articles/published-article/")
        data = resp.json()
        related_slugs = [a["slug_en"] for a in data["related"]]
        assert "published-article" not in related_slugs

    def test_detail_contract_uses_localized_reading_time_topic_related_and_updated_at(
        self, api_client, published_article, topic, db
    ):
        related = Article.objects.create(
            slug_fa="related-fa",
            slug_en="related-en",
            title_fa="Related FA",
            title_en="Related EN",
            status="published",
            published_at=timezone.now(),
            reading_time_fa=7,
            reading_time_en=4,
        )
        related.topics.add(topic)

        resp = api_client.get(
            "/api/public/blog/articles/published-article/?locale=en"
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["reading_time"] == 2
        assert parse_datetime(data["updated_at"]) == published_article.updated_at
        assert [item["slug_en"] for item in data["related"]] == ["related-en"]
        assert data["related"][0]["reading_time"] == 4
        assert "related_articles" not in data
        assert "previous_article" not in data
        assert "next_article" not in data

    def test_public_projection_resolves_active_media_and_omits_invalid_blocks(
        self, api_client, published_article, db
    ):
        active = MediaAsset.objects.create(
            file="media/2026/08/active.jpg",
            original_filename="active.jpg",
            mime_type="image/jpeg",
            file_size=123,
            width=640,
            height=480,
            checksum="a" * 64,
            alt_text_en="Active alt",
            caption_en="Active caption",
            status="active",
        )
        archived = MediaAsset.objects.create(
            file="media/2026/08/archived.jpg",
            original_filename="archived.jpg",
            mime_type="image/jpeg",
            file_size=123,
            checksum="b" * 64,
            status="archived",
        )
        published_article.blocks.all().delete()
        ArticleBlock.objects.create(
            article=published_article,
            locale="en",
            block_type="image",
            content={
                "media_id": str(active.id),
                "url": "https://caller.invalid/image.jpg",
                "alt": "Caller alt",
            },
            ordering=0,
        )
        ArticleBlock.objects.create(
            article=published_article,
            locale="en",
            block_type="image",
            content={"media_id": str(archived.id)},
            ordering=1,
        )
        ArticleBlock.objects.create(
            article=published_article,
            locale="en",
            block_type="paragraph",
            content={"text": "<b>legacy raw HTML</b>"},
            ordering=2,
        )
        ArticleBlock.objects.create(
            article=published_article,
            locale="en",
            block_type="embed",
            content={"url": "https://example.com/widget"},
            ordering=3,
        )
        ArticleBlock.objects.create(
            article=published_article,
            locale="en",
            block_type="heading",
            content={"text": "<b>Unsafe heading</b>", "level": 2},
            ordering=4,
        )

        resp = api_client.get("/api/public/blog/articles/published-article/")

        assert resp.status_code == 200
        assert resp.json()["blocks"] == [
            {
                "id": str(published_article.blocks.get(ordering=0).id),
                "locale": "en",
                "block_type": "image",
                "content": {
                    "media_id": str(active.id),
                    "url": "/media/media/2026/08/active.jpg",
                    "alt": "Active alt",
                    "caption": "Active caption",
                    "width": 640,
                    "height": 480,
                },
                "ordering": 0,
            }
        ]
        assert resp.json()["toc"] == []
