"""Shared, locale-safe public identity projection."""

from apps.identity.models import (
    Affiliation, Certification, Education, Experience, LanguageProficiency,
    Publication, ResearchInterest, ResearchProject, ResumeVariant, SiteProfile, Skill, SocialLink,
)
from apps.identity.serializers import (
    PublicAffiliationSerializer, PublicCertificationSerializer, PublicEducationSerializer,
    PublicExperienceSerializer, PublicIdentitySerializer, PublicLanguageProficiencySerializer,
    PublicPublicationSerializer, PublicResearchInterestSerializer, PublicResearchProjectSerializer,
    PublicResumeVariantSerializer, PublicSkillSerializer, PublicSocialLinkSerializer,
)


def public_identity_payload(locale: str, request):
    """Return published identity data, omitting records incomplete in ``locale``."""
    localized = lambda queryset, field: queryset.filter(**{f"{field}_{locale}__gt": ""})
    context = {"locale": locale, "request": request}
    profile = localized(SiteProfile.objects.filter(status="published").select_related("portrait"), "name").first()
    if profile is None:
        return {
            "profile": None, "social_links": [], "skills": [], "experience": [],
            "education": [], "certifications": [], "affiliations": [], "languages": [],
            "research_projects": [], "research_interests": [], "publications": [], "resumes": [],
        }
    return {
        "profile": PublicIdentitySerializer(profile, context=context).data,
        "social_links": PublicSocialLinkSerializer(localized(SocialLink.objects.filter(status="published"), "label"), many=True, context=context).data,
        "skills": PublicSkillSerializer(localized(Skill.objects.filter(status="published"), "name"), many=True, context=context).data,
        "experience": PublicExperienceSerializer(localized(Experience.objects.filter(status="published"), "title"), many=True, context=context).data,
        "education": PublicEducationSerializer(localized(Education.objects.filter(status="published"), "degree"), many=True, context=context).data,
        "certifications": PublicCertificationSerializer(localized(Certification.objects.filter(status="published"), "title"), many=True, context=context).data,
        "affiliations": PublicAffiliationSerializer(localized(Affiliation.objects.filter(status="published"), "organization"), many=True, context=context).data,
        "languages": PublicLanguageProficiencySerializer(localized(LanguageProficiency.objects.filter(status="published"), "name"), many=True, context=context).data,
        "research_projects": PublicResearchProjectSerializer(localized(ResearchProject.objects.filter(status="published"), "title"), many=True, context=context).data,
        "research_interests": PublicResearchInterestSerializer(localized(ResearchInterest.objects.filter(status="published"), "name"), many=True, context=context).data,
        "publications": PublicPublicationSerializer(localized(Publication.objects.filter(status="published"), "title"), many=True, context=context).data,
        "resumes": PublicResumeVariantSerializer(
            localized(ResumeVariant.objects.filter(status="published", file__status="active").select_related("file"), "label"),
            many=True,
            context=context,
        ).data,
    }
