"""Create an opt-in, draft-only Composer demonstration fixture."""

from __future__ import annotations

import hashlib
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.cms.models import Block, Page, Section
from apps.identity.models import (
    Affiliation, Certification, Education, Experience, LanguageProficiency,
    Publication, ResearchInterest, ResearchProject, ResumeVariant, SiteProfile,
    Skill, SocialLink,
)
from apps.media.models import MediaAsset
from apps.portfolio.models import CaseStudy, CaseStudyBlock
from apps.siteconfig.models import NavigationItem, RedirectRule, SiteSettings


SEED_MARKER = "seed_composer_demo"
ASSET_DIRECTORY = Path(__file__).resolve().parents[2] / "seed_assets"
ASSETS = (
    ("composer-demo-gallery.svg", "تصویر گالری نمونهٔ کامپوزر", "Composer demo gallery artwork"),
    ("composer-demo-hero.svg", "تصویر سربرگ نمونهٔ کامپوزر", "Composer demo hero artwork"),
)


class Command(BaseCommand):
    help = "Create a draft-only Composer demo on an empty development database"

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_composer_demo can run only when DEBUG is true.")

        if self._is_complete_demo():
            self.stdout.write(self.style.SUCCESS("Composer demo already exists; no changes made."))
            return

        if self._has_existing_content():
            raise CommandError(
                "seed_composer_demo requires an empty CMS, identity, siteconfig, and portfolio dataset."
            )

        with transaction.atomic():
            media = self._create_media()
            self._create_page(media)
            self._create_site_records()
            self._create_case_study(media)

        self.stdout.write(self.style.SUCCESS("Draft-only Composer demo created."))

    def _is_complete_demo(self) -> bool:
        if not Page.objects.filter(slug_en="composer-demo", created_by=SEED_MARKER).exists():
            return False
        expected_counts = {
            Page: 1, Section: 1, Block: 3, SiteProfile: 1, SiteSettings: 1,
            NavigationItem: 1, CaseStudy: 1, MediaAsset: 2,
        }
        return all(model.objects.count() == count for model, count in expected_counts.items()) and not any(
            model.objects.exists()
            for model in (
                Affiliation, Certification, Education, Experience, LanguageProficiency,
                Publication, ResearchInterest, ResearchProject, ResumeVariant, Skill,
                SocialLink, RedirectRule, CaseStudyBlock,
            )
        )

    def _has_existing_content(self) -> bool:
        return any(
            model.objects.exists()
            for model in (
                Page, Section, Block, SiteProfile, SiteSettings, NavigationItem,
                CaseStudy, MediaAsset, Affiliation, Certification, Education,
                Experience, LanguageProficiency, Publication, ResearchInterest,
                ResearchProject, ResumeVariant, Skill, SocialLink, RedirectRule,
                CaseStudyBlock,
            )
        )

    def _create_media(self) -> list[MediaAsset]:
        media = []
        for filename, alt_text_fa, alt_text_en in ASSETS:
            source = ASSET_DIRECTORY / filename
            content = source.read_bytes()
            asset = MediaAsset(
                original_filename=filename,
                mime_type="image/svg+xml",
                file_size=len(content),
                checksum=hashlib.sha256(content).hexdigest(),
                alt_text_fa=alt_text_fa,
                alt_text_en=alt_text_en,
                status="active",
                created_by=SEED_MARKER,
                updated_by=SEED_MARKER,
            )
            with source.open("rb") as handle:
                asset.file.save(filename, File(handle), save=False)
            asset.save()
            media.append(asset)
        return media

    def _create_page(self, media: list[MediaAsset]) -> None:
        page = Page.objects.create(
            slug_fa="نمونه-کامپوزر",
            slug_en="composer-demo",
            title_fa="نمونهٔ پیش‌نویس کامپوزر",
            title_en="Draft Composer Demo",
            page_type="custom",
            status="draft",
            created_by=SEED_MARKER,
            updated_by=SEED_MARKER,
        )
        section = Section.objects.create(page=page, ordering=0, enabled=True, layout="default")
        Block.objects.bulk_create([
            Block(section=section, block_type="hero", ordering=0, settings={
                "title": "Draft Composer Demo", "subtitle": "Development-only sample",
                "media_id": str(media[1].id), "cta_url": None, "cta_label": None,
            }),
            Block(section=section, block_type="text", ordering=1, settings={
                "content": "This neutral draft demonstrates Composer blocks before editorial review.",
                "alignment": "start",
            }),
            Block(section=section, block_type="gallery", ordering=2, settings={
                "media_ids": [str(asset.id) for asset in media], "layout": "grid",
            }),
        ])

    def _create_site_records(self) -> None:
        SiteProfile.objects.create(
            name_fa="پروفایل نمونهٔ پیش‌نویس", name_en="Draft Demo Profile",
            headline_fa="صرفاً برای بازبینی توسعه", headline_en="For development review only",
            status="draft", created_by=SEED_MARKER, updated_by=SEED_MARKER,
        )
        SiteSettings.objects.create(
            site_title_fa="تنظیمات نمونهٔ پیش‌نویس", site_title_en="Draft Demo Settings",
            primary_cta_label_fa="بازبینی", primary_cta_label_en="Review",
            primary_cta_url="/en/composer-demo", status="draft",
            created_by=SEED_MARKER, updated_by=SEED_MARKER,
        )
        NavigationItem.objects.create(
            label_fa="نمونهٔ کامپوزر", label_en="Composer Demo", href="/en/composer-demo",
            location="header", ordering=0, status="draft",
            created_by=SEED_MARKER, updated_by=SEED_MARKER,
        )

    def _create_case_study(self, media: list[MediaAsset]) -> None:
        case_study = CaseStudy.objects.create(
            slug_fa="نمونه-پروژه-کامپوزر", slug_en="composer-demo-case-study",
            title_fa="نمونهٔ پروژهٔ پیش‌نویس", title_en="Draft Composer Case Study",
            technologies=[], featured=False, status="draft",
            created_by=SEED_MARKER, updated_by=SEED_MARKER,
        )
        case_study.gallery.add(*media)
