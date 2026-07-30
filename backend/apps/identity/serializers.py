from rest_framework import serializers

from apps.identity.models import (
    Affiliation, Certification, Education, Experience, LanguageProficiency,
    Publication, ResearchInterest, ResearchProject, ResumeVariant,
    SiteProfile, Skill, SocialLink,
)
from apps.media.models import MediaAsset
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


class ExperienceAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = Experience


class EducationAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = Education


class CertificationAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = Certification


class AffiliationAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = Affiliation


class LanguageProficiencyAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = LanguageProficiency


class ResearchProjectAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = ResearchProject


class ResearchInterestAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = ResearchInterest


class PublicationAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = Publication


class ResumeVariantAdminSerializer(IdentityAdminSerializer):
    class Meta(IdentityAdminSerializer.Meta):
        model = ResumeVariant


class LocalizedPublicSerializer(serializers.ModelSerializer):
    """Projects bilingual fields to the requested locale without fallback."""

    def localized(self, instance, field):
        return getattr(instance, f"{field}_{self.context['locale']}")


class PublicExperienceSerializer(LocalizedPublicSerializer):
    organization = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    class Meta:
        model = Experience
        fields = ["organization", "title", "summary", "started_on", "ended_on"]
    get_organization = lambda self, obj: self.localized(obj, "organization")
    get_title = lambda self, obj: self.localized(obj, "title")
    get_summary = lambda self, obj: self.localized(obj, "summary")


class PublicEducationSerializer(LocalizedPublicSerializer):
    institution = serializers.SerializerMethodField()
    degree = serializers.SerializerMethodField()
    field = serializers.SerializerMethodField()
    class Meta:
        model = Education
        fields = ["institution", "degree", "field", "started_on", "ended_on"]
    get_institution = lambda self, obj: self.localized(obj, "institution")
    get_degree = lambda self, obj: self.localized(obj, "degree")
    get_field = lambda self, obj: self.localized(obj, "field")


class PublicCertificationSerializer(LocalizedPublicSerializer):
    title = serializers.SerializerMethodField()
    issuer = serializers.SerializerMethodField()
    class Meta:
        model = Certification
        fields = ["title", "issuer", "credential_url", "issued_on", "expires_on"]
    get_title = lambda self, obj: self.localized(obj, "title")
    get_issuer = lambda self, obj: self.localized(obj, "issuer")


class PublicAffiliationSerializer(LocalizedPublicSerializer):
    organization = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    class Meta:
        model = Affiliation
        fields = ["organization", "role", "url"]
    get_organization = lambda self, obj: self.localized(obj, "organization")
    get_role = lambda self, obj: self.localized(obj, "role")


class PublicLanguageProficiencySerializer(LocalizedPublicSerializer):
    name = serializers.SerializerMethodField()
    class Meta:
        model = LanguageProficiency
        fields = ["name", "proficiency"]
    get_name = lambda self, obj: self.localized(obj, "name")


class PublicResearchProjectSerializer(LocalizedPublicSerializer):
    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    methodology = serializers.SerializerMethodField()
    class Meta:
        model = ResearchProject
        fields = ["slug_fa", "slug_en", "title", "summary", "methodology", "featured", "published_at"]
    get_title = lambda self, obj: self.localized(obj, "title")
    get_summary = lambda self, obj: self.localized(obj, "summary")
    get_methodology = lambda self, obj: self.localized(obj, "methodology")


class PublicResearchInterestSerializer(LocalizedPublicSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    class Meta:
        model = ResearchInterest
        fields = ["name", "description"]
    get_name = lambda self, obj: self.localized(obj, "name")
    get_description = lambda self, obj: self.localized(obj, "description")


class PublicPublicationSerializer(LocalizedPublicSerializer):
    title = serializers.SerializerMethodField()
    abstract = serializers.SerializerMethodField()
    class Meta:
        model = Publication
        fields = ["slug_fa", "slug_en", "title", "abstract", "publication_type", "citation", "doi", "isbn", "published_on"]
    get_title = lambda self, obj: self.localized(obj, "title")
    get_abstract = lambda self, obj: self.localized(obj, "abstract")


class PublicResumeFileSerializer(serializers.ModelSerializer):
    """Minimal public metadata for a downloadable, active resume file."""

    file = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = ["file", "original_filename", "mime_type", "file_size"]
        read_only_fields = fields

    def get_file(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class PublicResumeVariantSerializer(LocalizedPublicSerializer):
    label = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    file = PublicResumeFileSerializer(read_only=True)
    class Meta:
        model = ResumeVariant
        fields = ["slug", "label", "summary", "variant_type", "file"]
    get_label = lambda self, obj: self.localized(obj, "label")
    get_summary = lambda self, obj: self.localized(obj, "summary")
