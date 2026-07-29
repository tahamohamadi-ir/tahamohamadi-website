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
