"""Contract tests for the opt-in, draft-only Composer demo fixture."""

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings
from rest_framework.test import APIClient

from apps.cms.models import Block, Page, Section
from apps.identity.models import SiteProfile, SocialLink
from apps.media.models import MediaAsset
from apps.portfolio.models import CaseStudy
from apps.siteconfig.models import NavigationItem, SiteSettings


@pytest.mark.django_db
class TestSeedComposerDemo:
    def test_refuses_to_run_outside_debug(self):
        with override_settings(DEBUG=False), pytest.raises(CommandError, match="DEBUG"):
            call_command("seed_composer_demo")

    def test_refuses_non_empty_cms_identity_siteconfig_or_portfolio_data(self):
        Page.objects.create(
            slug_fa="صفحه-موجود",
            slug_en="existing-page",
            title_fa="موجود",
            title_en="Existing",
            page_type="custom",
        )

        with override_settings(DEBUG=True), pytest.raises(CommandError, match="empty"):
            call_command("seed_composer_demo")

        assert not MediaAsset.objects.exists()

    def test_creates_only_draft_composer_demo_content_and_keeps_it_private(self):
        with override_settings(DEBUG=True):
            call_command("seed_composer_demo")

        page = Page.objects.get(slug_en="composer-demo")
        assert page.status == "draft"
        assert page.published_at is None
        assert page.created_by == "seed_composer_demo"
        assert list(page.sections.values_list("ordering", flat=True)) == [0]
        assert list(page.sections.get().blocks.values_list("block_type", "ordering")) == [
            ("hero", 0),
            ("text", 1),
            ("gallery", 2),
        ]

        media = list(MediaAsset.objects.order_by("original_filename"))
        assert len(media) == 2
        assert all(asset.status == "active" for asset in media)
        assert all(asset.alt_text_fa and asset.alt_text_en for asset in media)
        assert all(asset.created_by == "seed_composer_demo" for asset in media)
        blocks = list(page.sections.get().blocks.order_by("ordering"))
        assert blocks[0].settings["media_id"] in {str(asset.id) for asset in media}
        assert set(blocks[2].settings["media_ids"]) == {str(asset.id) for asset in media}

        assert SiteProfile.objects.get().status == "draft"
        assert SiteProfile.objects.get().public_email == ""
        assert SiteSettings.objects.get().status == "draft"
        assert SiteSettings.objects.get().public_email == ""
        assert NavigationItem.objects.get(location="header").status == "draft"
        case_study = CaseStudy.objects.get(slug_en="composer-demo-case-study")
        assert case_study.status == "draft"
        assert case_study.published_at is None
        assert set(case_study.gallery.values_list("id", flat=True)) == {asset.id for asset in media}
        assert not any(
            value.published_at is not None
            for value in [page, case_study]
        )
        assert not SocialLink.objects.exists()
        assert not get_user_model().objects.exists()

        response = APIClient().get("/api/public/pages/composer-demo/", {"locale": "en"})
        assert response.status_code == 404

    def test_second_run_recognizes_only_the_complete_demo_marker_and_creates_no_duplicates(self):
        with override_settings(DEBUG=True):
            call_command("seed_composer_demo")
        counts = {
            "pages": Page.objects.count(),
            "sections": Section.objects.count(),
            "blocks": Block.objects.count(),
            "profiles": SiteProfile.objects.count(),
            "settings": SiteSettings.objects.count(),
            "navigation": NavigationItem.objects.count(),
            "case_studies": CaseStudy.objects.count(),
            "media": MediaAsset.objects.count(),
        }

        with override_settings(DEBUG=True):
            call_command("seed_composer_demo")

        assert counts == {
            "pages": Page.objects.count(),
            "sections": Section.objects.count(),
            "blocks": Block.objects.count(),
            "profiles": SiteProfile.objects.count(),
            "settings": SiteSettings.objects.count(),
            "navigation": NavigationItem.objects.count(),
            "case_studies": CaseStudy.objects.count(),
            "media": MediaAsset.objects.count(),
        }
