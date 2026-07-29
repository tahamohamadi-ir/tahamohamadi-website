"""Editable site-wide public configuration."""

from django.db import models

from apps.core.models import VersionedModel


class SiteSettings(VersionedModel):
    """The single site-wide configuration record."""

    singleton = models.BooleanField(default=True, unique=True, editable=False)
    site_title_fa = models.CharField(max_length=255)
    site_title_en = models.CharField(max_length=255)
    default_title_fa = models.CharField(max_length=255, blank=True, default="")
    default_title_en = models.CharField(max_length=255, blank=True, default="")
    default_description_fa = models.TextField(blank=True, default="")
    default_description_en = models.TextField(blank=True, default="")
    public_email = models.EmailField(blank=True, default="")
    primary_cta_label_fa = models.CharField(max_length=100, blank=True, default="")
    primary_cta_label_en = models.CharField(max_length=100, blank=True, default="")
    primary_cta_url = models.CharField(max_length=2048, blank=True, default="")
    footer_text_fa = models.TextField(blank=True, default="")
    footer_text_en = models.TextField(blank=True, default="")
    default_og_image = models.ForeignKey(
        "media.MediaAsset", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="site_default_og_images",
    )
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["-updated_at"]


class NavigationItem(VersionedModel):
    LOCATIONS = [(location, location) for location in ("header", "footer")]

    label_fa = models.CharField(max_length=100)
    label_en = models.CharField(max_length=100)
    href = models.CharField(max_length=2048)
    location = models.CharField(max_length=20, choices=LOCATIONS)
    ordering = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="draft")

    class Meta:
        ordering = ["location", "ordering", "id"]


class RedirectRule(VersionedModel):
    STATUS_CODES = [(code, str(code)) for code in (301, 302)]

    source_path = models.CharField(max_length=2048, unique=True)
    target_url = models.CharField(max_length=2048)
    status_code = models.PositiveSmallIntegerField(choices=STATUS_CODES, default=301)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["source_path"]
