"""Contract tests for the admin media usage endpoint."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.blog.models import Article, ArticleBlock
from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset
from apps.portfolio.models import CaseStudy, CaseStudyBlock
from apps.workflow.models import AuditEvent


@pytest.fixture
def admin_client(db):
    user = get_user_model().objects.create_user(
        username="media-admin", password="not-used-in-this-test"
    )
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def media_asset(db):
    return MediaAsset.objects.create(
        original_filename="referenced-image.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        file="media/2026/07/referenced-image.jpg",
        checksum="a" * 64,
        status="active",
    )


@pytest.mark.django_db
def test_usage_endpoint_returns_cms_page_references(admin_client, media_asset):
    page = Page.objects.create(
        slug_fa="media-usage",
        slug_en="media-usage",
        title_fa="کاربرد رسانه",
        title_en="Media usage",
        page_type="custom",
        status="published",
    )
    section = Section.objects.create(page=page, ordering=0, enabled=True)
    Block.objects.create(
        section=section,
        block_type="hero",
        ordering=0,
        settings={"media_id": str(media_asset.id)},
    )

    response = admin_client.get(f"/api/admin/media/{media_asset.id}/usage/")

    assert response.status_code == 200
    assert response.json() == [
        {"type": "page", "id": str(page.id), "title": "Media usage"}
    ]


@pytest.mark.django_db
def test_archive_rejects_referenced_media_and_returns_its_impact(admin_client, media_asset):
    page = Page.objects.create(
        slug_fa="media-archive-impact",
        slug_en="media-archive-impact",
        title_fa="اثر بایگانی رسانه",
        title_en="Archive impact",
        page_type="custom",
        status="published",
    )
    section = Section.objects.create(page=page, ordering=0, enabled=True)
    Block.objects.create(
        section=section,
        block_type="hero",
        ordering=0,
        settings={"media_id": str(media_asset.id)},
    )

    response = admin_client.post(f"/api/admin/media/{media_asset.id}/archive/", format="json")

    assert response.status_code == 409
    assert response.json()["usage_count"] == 1
    assert response.json()["usage"] == [
        {"type": "page", "id": str(page.id), "title": "Archive impact"}
    ]
    media_asset.refresh_from_db()
    assert media_asset.status == "active"


@pytest.mark.django_db
def test_replace_rewrites_cms_media_references_and_archives_the_source(
    admin_client, media_asset
):
    replacement = MediaAsset.objects.create(
        original_filename="replacement-image.jpg",
        mime_type="image/jpeg",
        file_size=2048,
        file="media/2026/07/replacement-image.jpg",
        checksum="b" * 64,
        status="active",
    )
    page = Page.objects.create(
        slug_fa="replace-media-reference",
        slug_en="replace-media-reference",
        title_fa="جایگزینی رسانه",
        title_en="Replace media",
        page_type="custom",
        status="published",
    )
    section = Section.objects.create(page=page, ordering=0, enabled=True)
    block = Block.objects.create(
        section=section,
        block_type="gallery",
        ordering=0,
        settings={"media_id": str(media_asset.id), "media_ids": [str(media_asset.id)]},
    )

    response = admin_client.post(
        f"/api/admin/media/{media_asset.id}/replace/",
        {"replacement_media_id": str(replacement.id)},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["replaced_usage_count"] == 1
    media_asset.refresh_from_db()
    block.refresh_from_db()
    assert media_asset.status == "archived"
    assert block.settings == {
        "media_id": str(replacement.id),
        "media_ids": [str(replacement.id)],
    }
    audit_event = AuditEvent.objects.order_by("-timestamp").first()
    assert audit_event is not None
    assert audit_event.to_status == "replaced"


@pytest.mark.django_db
def test_replace_rejects_an_invalid_replacement_id_without_archiving_the_source(
    admin_client, media_asset
):
    response = admin_client.post(
        f"/api/admin/media/{media_asset.id}/replace/",
        {"replacement_media_id": "not-a-uuid"},
        format="json",
    )

    assert response.status_code == 422
    media_asset.refresh_from_db()
    assert media_asset.status == "active"


@pytest.mark.django_db
def test_replace_rewrites_blog_and_portfolio_media_references(
    admin_client, media_asset
):
    replacement = MediaAsset.objects.create(
        original_filename="replacement.jpg",
        mime_type="image/jpeg",
        file_size=2048,
        file="media/2026/07/replacement.jpg",
        checksum="c" * 64,
        status="active",
    )
    article = Article.objects.create(
        slug_fa="replace-blog-media",
        slug_en="replace-blog-media",
        title_fa="جایگزینی رسانهٔ بلاگ",
        title_en="Replace blog media",
        featured_image=media_asset,
        status="published",
    )
    article_block = ArticleBlock.objects.create(
        article=article,
        locale="en",
        block_type="gallery",
        ordering=0,
        content={"media_ids": [str(media_asset.id)]},
    )
    case_study = CaseStudy.objects.create(
        slug_fa="replace-portfolio-media",
        slug_en="replace-portfolio-media",
        title_fa="جایگزینی رسانهٔ نمونه‌کار",
        title_en="Replace portfolio media",
        status="published",
    )
    case_study.gallery.add(media_asset)
    case_block = CaseStudyBlock.objects.create(
        case_study=case_study,
        locale="en",
        block_type="image",
        ordering=0,
        content={"media_id": str(media_asset.id)},
    )

    response = admin_client.post(
        f"/api/admin/media/{media_asset.id}/replace/",
        {"replacement_media_id": str(replacement.id)},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["replaced_usage_count"] == 2
    article.refresh_from_db()
    article_block.refresh_from_db()
    case_block.refresh_from_db()
    assert article.featured_image_id == replacement.id
    assert article_block.content == {"media_ids": [str(replacement.id)]}
    assert list(case_study.gallery.values_list("id", flat=True)) == [replacement.id]
    assert case_block.content == {"media_id": str(replacement.id)}


@pytest.mark.django_db
def test_media_list_filters_by_type_category_and_status(admin_client, media_asset):
    MediaAsset.objects.create(
        original_filename="active-document.pdf",
        mime_type="application/pdf",
        file_size=1024,
        file="media/2026/07/active-document.pdf",
        checksum="g" * 64,
        status="active",
    )
    MediaAsset.objects.create(
        original_filename="archived-image.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        file="media/2026/07/archived-image.jpg",
        checksum="h" * 64,
        status="archived",
    )

    response = admin_client.get("/api/admin/media/?mime_type_category=image&status=active")

    assert response.status_code == 200
    assert [asset["original_filename"] for asset in response.json()["results"]] == [
        "referenced-image.jpg"
    ]
