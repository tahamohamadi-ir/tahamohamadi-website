"""Typed public collection projections for CMS blocks."""

from apps.blog.models import Article
from apps.blog.serializers import PublicArticleListSerializer
from apps.identity.models import (
    Affiliation, Certification, Education, Experience, LanguageProficiency,
    Publication, ResearchInterest, ResearchProject, ResumeVariant, Skill,
)
from apps.portfolio.models import CaseStudy
from apps.portfolio.serializers import PublicCaseStudyListSerializer
from apps.identity.serializers import (
    PublicAffiliationSerializer, PublicCertificationSerializer, PublicEducationSerializer,
    PublicExperienceSerializer, PublicLanguageProficiencySerializer, PublicPublicationSerializer,
    PublicResearchInterestSerializer, PublicResearchProjectSerializer, PublicResumeVariantSerializer,
    PublicSkillSerializer,
)


IDENTITY_COLLECTIONS = {
    "skills": (Skill, PublicSkillSerializer, "name", "ordering"),
    "experience": (Experience, PublicExperienceSerializer, "title", "started_on"),
    "education": (Education, PublicEducationSerializer, "degree", "ended_on"),
    "certifications": (Certification, PublicCertificationSerializer, "title", "issued_on"),
    "affiliations": (Affiliation, PublicAffiliationSerializer, "organization", "ordering"),
    "languages": (LanguageProficiency, PublicLanguageProficiencySerializer, "name", "ordering"),
    "research_projects": (ResearchProject, PublicResearchProjectSerializer, "title", "published_at"),
    "research_interests": (ResearchInterest, PublicResearchInterestSerializer, "name", "ordering"),
    "publications": (Publication, PublicPublicationSerializer, "title", "published_on"),
    "resumes": (ResumeVariant, PublicResumeVariantSerializer, "label", "ordering"),
}

CONTENT_COLLECTIONS = {
    "portfolio": (CaseStudy, PublicCaseStudyListSerializer, "title", "published_at"),
    "blog": (Article, PublicArticleListSerializer, "title", "published_at"),
    # `posts` is retained as a documented CMS alias for the Blog source.
    "posts": (Article, PublicArticleListSerializer, "title", "published_at"),
}

ALL_COLLECTIONS = {**IDENTITY_COLLECTIONS, **CONTENT_COLLECTIONS}

# A collection block is a compact presentation projection. The generic public
# list serializers include operational fields and nested data that are useful
# on their own API endpoints but must not become raw CMS-block inputs.
_COLLECTION_EXCLUDED_FIELDS = {"id", "status", "technologies", "topics", "featured_image"}

FILTERS_BY_SOURCE = {
    "portfolio": {"featured"},
    "skills": {"category"},
    "research_projects": {"featured"},
    "publications": {"publication_type"},
    "resumes": {"variant_type"},
}


def resolve_identity_collection(settings: dict, locale: str, request) -> list[dict]:
    """Resolve an allowlisted public collection without exposing model identifiers."""
    source = settings.get("source")
    config = ALL_COLLECTIONS.get(source)
    if config is None:
        return []
    model, serializer_class, localized_field, dated_field = config
    requested_filter = settings.get("filter", {})
    if any(key not in FILTERS_BY_SOURCE.get(source, set()) for key in requested_filter):
        return []
    filters = {"status": "published", f"{localized_field}_{locale}__gt": ""}
    if source == "resumes":
        filters["file__status"] = "active"
    if "category" in requested_filter:
        filters[f"category_{locale}"] = requested_filter["category"]
    for key in ("featured", "publication_type", "variant_type"):
        if key in requested_filter:
            filters[key] = requested_filter[key]
    queryset = model.objects.filter(**filters)
    if source == "resumes":
        queryset = queryset.select_related("file")
    elif source in {"blog", "posts"}:
        queryset = queryset.select_related("featured_image").prefetch_related("topics")
    order = settings.get("order", "default")
    if order == "newest":
        queryset = queryset.order_by(f"-{dated_field}", "id")
    elif order == "oldest":
        queryset = queryset.order_by(dated_field, "id")
    serialized_items = serializer_class(
        queryset[:settings["limit"]], many=True, context={"locale": locale, "request": request}
    ).data
    return [
        {key: value for key, value in item.items() if key not in _COLLECTION_EXCLUDED_FIELDS}
        for item in serialized_items
    ]
