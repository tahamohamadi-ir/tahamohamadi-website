"""Editable, bilingual public identity records."""

from django.db import models

from apps.core.models import VersionedModel


class SiteProfile(VersionedModel):
    """The single public profile record; public data is served only when published."""

    name_fa = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255)
    headline_fa = models.CharField(max_length=500, blank=True, default="")
    headline_en = models.CharField(max_length=500, blank=True, default="")
    bio_fa = models.TextField(blank=True, default="")
    bio_en = models.TextField(blank=True, default="")
    public_email = models.EmailField(blank=True, default="")
    portrait = models.ForeignKey(
        "media.MediaAsset", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="identity_portraits",
    )
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["-updated_at"]


class SocialLink(VersionedModel):
    label_fa = models.CharField(max_length=100)
    label_en = models.CharField(max_length=100)
    url = models.URLField()
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["ordering", "id"]


class Skill(VersionedModel):
    name_fa = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    category_fa = models.CharField(max_length=100, blank=True, default="")
    category_en = models.CharField(max_length=100, blank=True, default="")
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["ordering", "id"]


class Experience(VersionedModel):
    organization_fa = models.CharField(max_length=255)
    organization_en = models.CharField(max_length=255)
    title_fa = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)
    summary_fa = models.TextField(blank=True, default="")
    summary_en = models.TextField(blank=True, default="")
    started_on = models.DateField()
    ended_on = models.DateField(null=True, blank=True)
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["-started_on", "ordering", "id"]


class Education(VersionedModel):
    institution_fa = models.CharField(max_length=255)
    institution_en = models.CharField(max_length=255)
    degree_fa = models.CharField(max_length=255)
    degree_en = models.CharField(max_length=255)
    field_fa = models.CharField(max_length=255, blank=True, default="")
    field_en = models.CharField(max_length=255, blank=True, default="")
    started_on = models.DateField(null=True, blank=True)
    ended_on = models.DateField(null=True, blank=True)
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["-ended_on", "-started_on", "ordering", "id"]


class Certification(VersionedModel):
    title_fa = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)
    issuer_fa = models.CharField(max_length=255)
    issuer_en = models.CharField(max_length=255)
    credential_url = models.URLField(blank=True, default="")
    issued_on = models.DateField(null=True, blank=True)
    expires_on = models.DateField(null=True, blank=True)
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["-issued_on", "ordering", "id"]


class Affiliation(VersionedModel):
    organization_fa = models.CharField(max_length=255)
    organization_en = models.CharField(max_length=255)
    role_fa = models.CharField(max_length=255, blank=True, default="")
    role_en = models.CharField(max_length=255, blank=True, default="")
    url = models.URLField(blank=True, default="")
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["ordering", "id"]


class LanguageProficiency(VersionedModel):
    LEVELS = [(level, level) for level in ("basic", "intermediate", "advanced", "native")]

    name_fa = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=20, choices=LEVELS)
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["ordering", "id"]


class ResearchProject(VersionedModel):
    slug_fa = models.SlugField(max_length=255, unique=True, allow_unicode=True)
    slug_en = models.SlugField(max_length=255, unique=True)
    title_fa = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)
    summary_fa = models.TextField(blank=True, default="")
    summary_en = models.TextField(blank=True, default="")
    methodology_fa = models.TextField(blank=True, default="")
    methodology_en = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, default="draft")
    featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at", "-updated_at"]


class ResearchInterest(VersionedModel):
    name_fa = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255)
    description_fa = models.TextField(blank=True, default="")
    description_en = models.TextField(blank=True, default="")
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["ordering", "id"]


class Publication(VersionedModel):
    TYPES = [(kind, kind) for kind in ("article", "book", "conference", "report", "manuscript")]

    slug_fa = models.SlugField(max_length=255, unique=True, allow_unicode=True)
    slug_en = models.SlugField(max_length=255, unique=True)
    title_fa = models.CharField(max_length=500)
    title_en = models.CharField(max_length=500)
    abstract_fa = models.TextField(blank=True, default="")
    abstract_en = models.TextField(blank=True, default="")
    publication_type = models.CharField(max_length=20, choices=TYPES)
    citation = models.TextField(blank=True, default="")
    doi = models.CharField(max_length=255, blank=True, default="")
    isbn = models.CharField(max_length=32, blank=True, default="")
    published_on = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["-published_on", "-updated_at"]
