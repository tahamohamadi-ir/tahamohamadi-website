from rest_framework import serializers

from apps.identity.models import SiteProfile, Skill, SocialLink
from apps.media.serializers import MediaAssetSerializer


class PublicIdentitySerializer(serializers.ModelSerializer):
    portrait = MediaAssetSerializer(read_only=True)
    name = serializers.SerializerMethodField()
    headline = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()

    class Meta:
        model = SiteProfile
        fields = ["name", "headline", "bio", "public_email", "portrait"]

    def _localized(self, instance, field):
        return getattr(instance, f"{field}_{self.context['locale']}")

    def get_name(self, instance):
        return self._localized(instance, "name")

    def get_headline(self, instance):
        return self._localized(instance, "headline")

    def get_bio(self, instance):
        return self._localized(instance, "bio")


class PublicSocialLinkSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = SocialLink
        fields = ["label", "url"]

    def get_label(self, instance):
        return getattr(instance, f"label_{self.context['locale']}")


class PublicSkillSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = ["name", "category"]

    def get_name(self, instance):
        return getattr(instance, f"name_{self.context['locale']}")

    def get_category(self, instance):
        return getattr(instance, f"category_{self.context['locale']}")


class IdentityAdminSerializer(serializers.ModelSerializer):
    """Shared admin projection for versioned identity resources."""

    id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = SiteProfile
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "created_by", "updated_by")


class SiteProfileAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = SiteProfile


class SocialLinkAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = SocialLink


class SkillAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = Skill
