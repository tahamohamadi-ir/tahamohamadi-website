"""Integration coverage for the persistent media usage index."""

from io import StringIO

import pytest
from django.core.management import CommandError, call_command

from apps.blog.models import Article, ArticleBlock
from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset
from apps.portfolio.models import CaseStudy, CaseStudyBlock


@pytest.mark.django_db
def test_reconcile_media_usage_indexes_a_cms_block_reference():
    source = MediaAsset.objects.create(
        original_filename="indexed-image.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        file="media/2026/07/indexed-image.jpg",
        checksum="d" * 64,
        status="active",
    )
    page = Page.objects.create(
        slug_fa="indexed-media",
        slug_en="indexed-media",
        title_fa="رسانهٔ ایندکس‌شده",
        title_en="Indexed media",
        page_type="custom",
        status="published",
    )
    section = Section.objects.create(page=page, ordering=0, enabled=True)
    block = Block.objects.create(
        section=section,
        block_type="hero",
        ordering=0,
        settings={"media_id": str(source.id)},
    )

    try:
        call_command("reconcile_media_usage", stdout=StringIO())
    except CommandError:
        command_available = False
    else:
        command_available = True

    assert command_available is True

    from apps.media.models import MediaUsageReference

    assert list(
        MediaUsageReference.objects.values(
            "media_id", "source_type", "source_id", "owner_type", "owner_id", "reference_field"
        )
    ) == [
        {
            "media_id": source.id,
            "source_type": "cms_block",
            "source_id": block.id,
            "owner_type": "page",
            "owner_id": page.id,
            "reference_field": "settings.media_id",
        }
    ]


@pytest.mark.django_db
def test_reconcile_media_usage_removes_stale_index_rows():
    source = MediaAsset.objects.create(
        original_filename="stale-index-image.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        file="media/2026/07/stale-index-image.jpg",
        checksum="e" * 64,
        status="active",
    )
    page = Page.objects.create(
        slug_fa="stale-index-media",
        slug_en="stale-index-media",
        title_fa="رسانهٔ قدیمی",
        title_en="Stale media",
        page_type="custom",
        status="published",
    )
    section = Section.objects.create(page=page, ordering=0, enabled=True)
    block = Block.objects.create(
        section=section,
        block_type="hero",
        ordering=0,
        settings={"media_id": str(source.id)},
    )

    call_command("reconcile_media_usage", stdout=StringIO())
    block.settings = {}
    block.save(update_fields=["settings"])
    call_command("reconcile_media_usage", stdout=StringIO())

    from apps.media.models import MediaUsageReference

    assert MediaUsageReference.objects.filter(media=source).count() == 0


@pytest.mark.django_db
def test_reconcile_media_usage_indexes_blog_and_portfolio_reference_shapes():
    source = MediaAsset.objects.create(
        original_filename="all-reference-shapes.jpg",
        mime_type="image/jpeg",
        file_size=1024,
        file="media/2026/07/all-reference-shapes.jpg",
        checksum="f" * 64,
        status="active",
    )
    article = Article.objects.create(
        slug_fa="indexed-blog-media",
        slug_en="indexed-blog-media",
        title_fa="رسانهٔ بلاگ",
        title_en="Blog media",
        featured_image=source,
        status="published",
    )
    article_block = ArticleBlock.objects.create(
        article=article,
        locale="en",
        block_type="gallery",
        ordering=0,
        content={"media_ids": [str(source.id)]},
    )
    case_study = CaseStudy.objects.create(
        slug_fa="indexed-case-media",
        slug_en="indexed-case-media",
        title_fa="رسانهٔ نمونه‌کار",
        title_en="Case study media",
        status="published",
    )
    case_study.gallery.add(source)
    case_study_block = CaseStudyBlock.objects.create(
        case_study=case_study,
        locale="en",
        block_type="image",
        ordering=0,
        content={"media_id": str(source.id)},
    )

    call_command("reconcile_media_usage", stdout=StringIO())

    from apps.media.models import MediaUsageReference

    assert set(
        MediaUsageReference.objects.filter(media=source).values_list(
            "source_type", "source_id", "owner_type", "owner_id", "reference_field"
        )
    ) == {
        ("article", article.id, "article", article.id, "featured_image"),
        ("article_block", article_block.id, "article", article.id, "content.media_ids"),
        ("case_study", case_study.id, "case_study", case_study.id, "gallery"),
        (
            "case_study_block",
            case_study_block.id,
            "case_study",
            case_study.id,
            "content.media_id",
        ),
    }
