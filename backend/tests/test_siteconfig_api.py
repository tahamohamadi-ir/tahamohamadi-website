import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.siteconfig.models import NavigationItem, SiteSettings


@pytest.mark.django_db
def test_public_site_config_projects_published_localized_settings_and_navigation():
    SiteSettings.objects.create(
        site_title_fa="عنوان فارسی", site_title_en="English title",
        default_title_fa="سئو فارسی", default_title_en="English SEO",
        primary_cta_label_fa="تماس", primary_cta_label_en="Contact",
        primary_cta_url="/fa/contact", footer_text_fa="پاورقی", footer_text_en="Footer",
        status="published",
    )
    NavigationItem.objects.create(label_fa="خانه", label_en="Home", href="/fa", location="header", status="published")
    NavigationItem.objects.create(label_fa="گیت‌هاب", label_en="GitHub", href="https://github.com/example", location="footer", status="published")
    NavigationItem.objects.create(label_fa="پیش‌نویس", label_en="Draft", href="/draft", location="header", status="draft")

    response = APIClient().get("/api/public/site/?locale=fa")

    assert response.status_code == 200
    assert response.json() == {
        "settings": {
            "site_title": "عنوان فارسی", "default_title": "سئو فارسی", "default_description": "",
            "public_email": "", "primary_cta_label": "تماس", "primary_cta_url": "/fa/contact",
            "footer_text": "پاورقی", "default_og_image": None,
        },
        "navigation": {
            "header": [{"label": "خانه", "href": "/fa"}],
            "footer": [{"label": "گیت‌هاب", "href": "https://github.com/example"}],
        },
    }


@pytest.mark.django_db
def test_site_config_admin_requires_auth_and_rejects_unsafe_destinations():
    client = APIClient()
    navigation = {"label_fa": "خانه", "label_en": "Home", "href": "/fa", "location": "header"}
    assert client.post("/api/admin/site/navigation/", navigation, format="json").status_code == 403

    user = get_user_model().objects.create_user(username="siteconfig-admin")
    client.force_authenticate(user)
    assert client.post("/api/admin/site/navigation/", {**navigation, "href": "javascript:alert(1)"}, format="json").status_code == 422
    assert client.post("/api/admin/site/navigation/", {**navigation, "href": "//evil.example"}, format="json").status_code == 422
    assert client.post("/api/admin/site/navigation/", {**navigation, "href": "http://example.test"}, format="json").status_code == 422
    assert client.post("/api/admin/site/navigation/", navigation, format="json").status_code == 201
    assert client.post(
        "/api/admin/site/redirects/",
        {"source_path": "/old?next=/private", "target_url": "/new", "status_code": 301},
        format="json",
    ).status_code == 422
    assert client.post(
        "/api/admin/site/redirects/",
        {"source_path": "/old", "target_url": "https://example.test/new", "status_code": 301},
        format="json",
    ).status_code == 201
