"""Admin and public serializers for site-wide configuration."""

from urllib.parse import urlsplit

from rest_framework import serializers

from apps.media.serializers import MediaAssetSerializer
from apps.siteconfig.models import NavigationItem, RedirectRule, SiteSettings


def validate_safe_destination(value: str) -> str:
    """Allow only absolute internal paths or absolute HTTPS destinations."""
    value = value.strip()
    if not value or any(character.isspace() for character in value):
        raise serializers.ValidationError("Use an internal path or an absolute HTTPS URL.")
    if value.startswith("/"):
        if value.startswith("//") or urlsplit(value).scheme or urlsplit(value).netloc:
            raise serializers.ValidationError("Internal paths must not include a host.")
        return value
    parsed = urlsplit(value)
    if parsed.scheme != "https" or not parsed.netloc:
        raise serializers.ValidationError("External URLs must use HTTPS.")
    return value


def validate_redirect_source(value: str) -> str:
    value = value.strip()
    parsed = urlsplit(value)
    if (
        not value.startswith("/")
        or value.startswith("//")
        or parsed.scheme
        or parsed.netloc
        or parsed.query
        or parsed.fragment
    ):
        raise serializers.ValidationError("Redirect sources must be an internal path without query or fragment.")
    return value


class SiteConfigAdminSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = SiteSettings
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "created_by", "updated_by")

    def validate_primary_cta_url(self, value):
        return validate_safe_destination(value) if value else value


class NavigationItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = NavigationItem
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "created_by", "updated_by")

    def validate_href(self, value):
        return validate_safe_destination(value)


class RedirectRuleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = RedirectRule
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "created_by", "updated_by")

    def validate_source_path(self, value):
        return validate_redirect_source(value)

    def validate_target_url(self, value):
        return validate_safe_destination(value)


class PublicSiteSettingsSerializer(serializers.ModelSerializer):
    site_title = serializers.SerializerMethodField()
    default_title = serializers.SerializerMethodField()
    default_description = serializers.SerializerMethodField()
    primary_cta_label = serializers.SerializerMethodField()
    footer_text = serializers.SerializerMethodField()
    default_og_image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = SiteSettings
        fields = [
            "site_title", "default_title", "default_description", "public_email",
            "primary_cta_label", "primary_cta_url", "footer_text", "default_og_image",
            "theme_preset", "density", "design_tokens",
        ]

    def _localized(self, instance, field):
        return getattr(instance, f"{field}_{self.context['locale']}")

    get_site_title = lambda self, obj: self._localized(obj, "site_title")
    get_default_title = lambda self, obj: self._localized(obj, "default_title")
    get_default_description = lambda self, obj: self._localized(obj, "default_description")
    get_primary_cta_label = lambda self, obj: self._localized(obj, "primary_cta_label")
    get_footer_text = lambda self, obj: self._localized(obj, "footer_text")


class PublicNavigationItemSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = NavigationItem
        fields = ["label", "href"]

    def get_label(self, instance):
        return getattr(instance, f"label_{self.context['locale']}")
