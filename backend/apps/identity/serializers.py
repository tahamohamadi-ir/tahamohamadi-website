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
