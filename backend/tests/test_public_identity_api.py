import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.identity.models import Publication, ResearchProject, Experience, SiteProfile, Skill, SocialLink


@pytest.mark.django_db
def test_public_identity_suppresses_drafts_and_localizes():
    SiteProfile.objects.create(
        name_fa="نام فارسی", name_en="English name", headline_fa="تیتر", headline_en="Headline",
        bio_fa="زندگینامه", bio_en="Biography", public_email="public@example.test", status="published",
    )
    SocialLink.objects.create(label_fa="گیت‌هاب", label_en="GitHub", url="https://github.com/example", status="published")
    SocialLink.objects.create(label_fa="پنهان", label_en="Hidden", url="https://example.test", status="draft")
    Skill.objects.create(name_fa="پایتون", name_en="Python", category_fa="فنی", category_en="Technical", status="published")

    response = APIClient().get("/api/public/identity/?locale=fa")

    assert response.status_code == 200
    assert response.json() == {
        "profile": {"name": "نام فارسی", "headline": "تیتر", "bio": "زندگینامه", "public_email": "public@example.test", "portrait": None},
        "social_links": [{"label": "گیت‌هاب", "url": "https://github.com/example"}],
        "skills": [{"name": "پایتون", "category": "فنی"}], "experience": [],
        "education": [], "certifications": [], "affiliations": [], "languages": [],
        "research_projects": [], "research_interests": [], "publications": [],
    }


@pytest.mark.django_db
def test_public_identity_has_explicit_empty_state_for_draft_profile():
    SiteProfile.objects.create(name_fa="draft", name_en="draft", status="draft")

    assert APIClient().get("/api/public/identity/").json() == {
        "profile": None, "social_links": [], "skills": [], "experience": [],
        "education": [], "certifications": [], "affiliations": [], "languages": [],
        "research_projects": [], "research_interests": [], "publications": [],
    }


@pytest.mark.django_db
def test_identity_admin_crud_requires_auth_and_enforces_optimistic_locking():
    client = APIClient()
    payload = {"name_fa": "نام", "name_en": "Name", "status": "draft"}
    assert client.post("/api/admin/identity/profiles/", payload, format="json").status_code == 403

    user = get_user_model().objects.create_user(username="identity-admin")
    client.force_authenticate(user)
    created = client.post("/api/admin/identity/profiles/", payload, format="json")
    assert created.status_code == 201
    profile_id = created.json()["id"]
    assert client.post("/api/admin/identity/profiles/", payload, format="json").status_code == 409

    updated = client.patch(
        f"/api/admin/identity/profiles/{profile_id}/",
        {"headline_en": "Updated", "version": 1},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.json()["version"] == 2

    stale = client.patch(
        f"/api/admin/identity/profiles/{profile_id}/",
        {"headline_en": "Stale", "version": 1},
        format="json",
    )
    assert stale.status_code == 409
    assert stale.json()["current_version"] == 2


@pytest.mark.django_db
def test_public_identity_includes_only_published_experience_in_requested_locale():
    SiteProfile.objects.create(name_fa="نام", name_en="Name", status="published")
    Experience.objects.create(
        organization_fa="سازمان", organization_en="Organization", title_fa="نقش",
        title_en="Role", summary_fa="خلاصه", summary_en="Summary",
        started_on="2025-01-01", status="published",
    )
    Experience.objects.create(
        organization_fa="پیش‌نویس", organization_en="Draft", title_fa="پیش‌نویس",
        title_en="Draft", started_on="2024-01-01", status="draft",
    )

    response = APIClient().get("/api/public/identity/?locale=fa")

    assert response.json()["experience"] == [{
        "organization": "سازمان", "title": "نقش", "summary": "خلاصه",
        "started_on": "2025-01-01", "ended_on": None,
    }]


@pytest.mark.django_db
def test_public_identity_suppresses_draft_research_and_publications():
    SiteProfile.objects.create(name_fa="نام", name_en="Name", status="published")
    ResearchProject.objects.create(
        slug_fa="پژوهش", slug_en="research", title_fa="پژوهش", title_en="Research",
        summary_fa="خلاصه", summary_en="Summary", status="published",
    )
    Publication.objects.create(
        slug_fa="مقاله", slug_en="paper", title_fa="مقاله", title_en="Paper",
        publication_type="article", status="published", doi="10.1000/example",
    )
    Publication.objects.create(
        slug_fa="پیش‌نویس", slug_en="draft", title_fa="پیش‌نویس", title_en="Draft",
        publication_type="manuscript", status="draft",
    )

    response = APIClient().get("/api/public/identity/?locale=en")

    assert [item["slug_en"] for item in response.json()["research_projects"]] == ["research"]
    assert [item["slug_en"] for item in response.json()["publications"]] == ["paper"]
