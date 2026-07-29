import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.identity.models import SiteProfile, Skill, SocialLink


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
        "skills": [{"name": "پایتون", "category": "فنی"}],
    }


@pytest.mark.django_db
def test_public_identity_has_explicit_empty_state_for_draft_profile():
    SiteProfile.objects.create(name_fa="draft", name_en="draft", status="draft")

    assert APIClient().get("/api/public/identity/").json() == {
        "profile": None, "social_links": [], "skills": []
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
