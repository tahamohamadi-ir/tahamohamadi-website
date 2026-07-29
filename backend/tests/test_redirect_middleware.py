import pytest
from rest_framework.test import APIClient

from apps.siteconfig.models import RedirectRule


@pytest.mark.django_db
def test_active_redirect_rules_apply_internal_and_external_targets():
    RedirectRule.objects.create(source_path="/old-internal", target_url="/new-internal", status_code=301)
    RedirectRule.objects.create(source_path="/old-external", target_url="https://example.test/new", status_code=302)
    client = APIClient()

    internal = client.get("/old-internal")
    external = client.get("/old-external")

    assert internal.status_code == 301
    assert internal["Location"] == "/new-internal"
    assert external.status_code == 302
    assert external["Location"] == "https://example.test/new"


@pytest.mark.django_db
def test_redirect_middleware_fails_closed_for_cycles_unsafe_targets_and_non_get_requests():
    RedirectRule.objects.create(source_path="/cycle-a", target_url="/cycle-b", status_code=301)
    RedirectRule.objects.create(source_path="/cycle-b", target_url="/cycle-a", status_code=301)
    RedirectRule.objects.create(source_path="/unsafe", target_url="javascript:alert(1)", status_code=302)
    RedirectRule.objects.create(source_path="/only-get", target_url="/new", status_code=301)
    client = APIClient()

    assert client.get("/cycle-a").status_code == 404
    assert client.get("/unsafe").status_code == 404
    assert client.post("/only-get", {}, format="json").status_code == 404
