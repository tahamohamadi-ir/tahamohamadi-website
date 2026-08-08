"""Contract tests for the opt-in, draft-only Composer demo fixture."""

import pytest
from uuid import uuid4
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings
from rest_framework.test import APIClient

from apps.cms.models import Block, Page, Section
from apps.identity.models import (
    Affiliation, Certification, Education, Experience, LanguageProficiency,
    Publication, ResearchInterest, ResearchProject, ResumeVariant, SiteProfile,
    Skill, SocialLink,
)
from apps.media.models import MediaAsset, MediaUsageReference
from apps.portfolio.models import CaseStudy, CaseStudyBlock
from apps.siteconfig.models import NavigationItem, RedirectRule, SiteSettings


def _media_asset():
    return MediaAsset.objects.create(
        file="media/existing.svg", original_filename="existing.svg",
        mime_type="image/svg+xml", file_size=1, checksum="a" * 64,
    )


def _create_in_scope_record(kind):
    def page():
        return Page.objects.create(
            slug_fa="صفحه-موجود", slug_en="existing-page", title_fa="موجود",
            title_en="Existing", page_type="custom",
        )

    def case_study():
        return CaseStudy.objects.create(
            slug_fa="نمونه-موجود", slug_en="existing-case-study", title_fa="موجود",
            title_en="Existing", status="draft",
        )

    creators = {
        "page": page,
        "section": lambda: Section.objects.create(page=page(), ordering=0),
        "block": lambda: Block.objects.create(section=Section.objects.create(page=page(), ordering=0), block_type="text", settings={"content": "x", "alignment": "start"}, ordering=0),
        "profile": lambda: SiteProfile.objects.create(name_fa="نمونه", name_en="Sample"),
        "settings": lambda: SiteSettings.objects.create(site_title_fa="نمونه", site_title_en="Sample"),
        "navigation": lambda: NavigationItem.objects.create(label_fa="نمونه", label_en="Sample", href="/en", location="header"),
        "redirect": lambda: RedirectRule.objects.create(source_path="/old", target_url="/en"),
        "case_study": case_study,
        "case_study_block": lambda: CaseStudyBlock.objects.create(case_study=case_study(), locale="en", block_type="text", content={}, ordering=0),
        "media": _media_asset,
        "media_usage_reference": lambda: MediaUsageReference.objects.create(
            media=_media_asset(), source_type="cms_block", source_id=uuid4(),
            owner_type="page", owner_id=uuid4(), reference_field="settings.media_id",
        ),
        "affiliation": lambda: Affiliation.objects.create(organization_fa="نمونه", organization_en="Sample"),
        "certification": lambda: Certification.objects.create(title_fa="نمونه", title_en="Sample", issuer_fa="نمونه", issuer_en="Sample"),
        "education": lambda: Education.objects.create(institution_fa="نمونه", institution_en="Sample", degree_fa="نمونه", degree_en="Sample"),
        "experience": lambda: Experience.objects.create(organization_fa="نمونه", organization_en="Sample", title_fa="نمونه", title_en="Sample", started_on="2020-01-01"),
        "language": lambda: LanguageProficiency.objects.create(name_fa="نمونه", name_en="Sample", proficiency="basic"),
        "publication": lambda: Publication.objects.create(slug_fa="انتشار-موجود", slug_en="existing-publication", title_fa="نمونه", title_en="Sample", publication_type="article"),
        "interest": lambda: ResearchInterest.objects.create(name_fa="نمونه", name_en="Sample"),
        "project": lambda: ResearchProject.objects.create(slug_fa="پروژه-موجود", slug_en="existing-project", title_fa="نمونه", title_en="Sample"),
        "resume": lambda: ResumeVariant.objects.create(slug="existing-resume", label_fa="نمونه", label_en="Sample", variant_type="general", file=_media_asset()),
        "skill": lambda: Skill.objects.create(name_fa="نمونه", name_en="Sample"),
        "social": lambda: SocialLink.objects.create(label_fa="نمونه", label_en="Sample", url="https://example.test"),
    }
    return creators[kind]()


@pytest.mark.django_db
class TestSeedComposerDemo:
    def test_refuses_to_run_outside_debug(self):
        with override_settings(DEBUG=False), pytest.raises(CommandError, match="DEBUG"):
            call_command("seed_composer_demo")

    @pytest.mark.parametrize("kind", [
        "page", "section", "block", "profile", "settings", "navigation", "redirect",
        "case_study", "case_study_block", "media", "affiliation", "certification",
        "education", "experience", "language", "publication", "interest", "project",
        "resume", "skill", "social", "media_usage_reference",
    ])
    def test_refuses_every_non_empty_in_scope_model(self, kind):
        existing = _create_in_scope_record(kind)

        with override_settings(DEBUG=True), pytest.raises(CommandError, match="empty"):
            call_command("seed_composer_demo")

        assert type(existing).objects.filter(pk=existing.pk).exists()
        assert not Page.objects.filter(slug_en="composer-demo").exists()

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
        assert Page.objects.count() == 1
        assert Section.objects.count() == 1
        assert Block.objects.count() == 3
        assert SiteProfile.objects.count() == 1
        assert SiteSettings.objects.count() == 1
        assert NavigationItem.objects.count() == 1
        assert CaseStudy.objects.count() == 1
        assert MediaAsset.objects.count() == 2
        assert not any(model.objects.exists() for model in (
            Affiliation, Certification, Education, Experience, LanguageProficiency,
            Publication, ResearchInterest, ResearchProject, ResumeVariant, Skill,
            SocialLink, RedirectRule, CaseStudyBlock,
        ))
        assert set(MediaUsageReference.objects.values_list(
            "source_type", "source_id", "reference_field", "media_id"
        )) == {
            ("cms_block", blocks[0].id, "settings.media_id", media[1].id),
            ("cms_block", blocks[2].id, "settings.media_ids", media[0].id),
            ("cms_block", blocks[2].id, "settings.media_ids", media[1].id),
            ("case_study", case_study.id, "gallery", media[0].id),
            ("case_study", case_study.id, "gallery", media[1].id),
        }
        assert MediaUsageReference.objects.count() == 5

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

    def test_refuses_a_partial_demo_marker(self):
        Page.objects.create(
            slug_fa="نمونه-کامپوزر", slug_en="composer-demo",
            title_fa="نمونهٔ پیش‌نویس کامپوزر", title_en="Draft Composer Demo",
            page_type="custom", status="draft", created_by="seed_composer_demo",
        )

        with override_settings(DEBUG=True), pytest.raises(CommandError, match="empty"):
            call_command("seed_composer_demo")

    def test_refuses_a_corrupt_complete_demo_marker(self):
        with override_settings(DEBUG=True):
            call_command("seed_composer_demo")
        navigation = NavigationItem.objects.get(location="header")
        navigation.href = "/en/corrupted"
        navigation.save(update_fields=["href"])

        with override_settings(DEBUG=True), pytest.raises(CommandError, match="empty"):
            call_command("seed_composer_demo")

        assert NavigationItem.objects.get(pk=navigation.pk).href == "/en/corrupted"
