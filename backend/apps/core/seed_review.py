"""Server-side review checklist for draft seed records."""

from apps.identity.models import (
    Affiliation, Certification, Education, Experience, LanguageProficiency,
    Publication, ResearchInterest, ResearchProject, ResumeVariant, SiteProfile, Skill, SocialLink,
)
from apps.siteconfig.models import NavigationItem, SiteSettings


SEED_RESOURCES = (
    ("site_profiles", SiteProfile, ("name_fa", "name_en")),
    ("social_links", SocialLink, ("label_fa", "label_en")),
    ("skills", Skill, ("name_fa", "name_en")),
    ("experience", Experience, ("organization_fa", "organization_en", "title_fa", "title_en")),
    ("education", Education, ("institution_fa", "institution_en", "degree_fa", "degree_en")),
    ("certifications", Certification, ("title_fa", "title_en", "issuer_fa", "issuer_en")),
    ("affiliations", Affiliation, ("organization_fa", "organization_en")),
    ("languages", LanguageProficiency, ("name_fa", "name_en")),
    ("research_projects", ResearchProject, ("title_fa", "title_en")),
    ("research_interests", ResearchInterest, ("name_fa", "name_en")),
    ("publications", Publication, ("title_fa", "title_en")),
    ("resumes", ResumeVariant, ("label_fa", "label_en")),
    ("site_settings", SiteSettings, ("site_title_fa", "site_title_en")),
    ("navigation", NavigationItem, ("label_fa", "label_en")),
)


def seed_review_report():
    """Report records that must be manually reviewed before any publication."""
    records = []
    issues = []
    for resource, model, locale_fields in SEED_RESOURCES:
        for item in model.objects.filter(created_by="seed").only("id", "status", *locale_fields):
            missing_locales = [field for field in locale_fields if not getattr(item, field)]
            record = {
                "resource": resource,
                "id": str(item.id),
                "status": item.status,
                "missing_locales": missing_locales,
                "requires_manual_review": True,
            }
            records.append(record)
            if item.status != "draft":
                issues.append({**record, "reason": "Seed records must remain draft until human review."})
            if missing_locales:
                issues.append({**record, "reason": "Both locale fields must be complete before review."})
    return {
        "automatic_publish_allowed": False,
        "seed_record_count": len(records),
        "records": records,
        "issues": issues,
    }
