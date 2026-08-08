"""Focused contracts for portable Composer Draft templates."""

from copy import deepcopy

import pytest

from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset


IMPORT_URL = "/api/admin/pages/templates/import/"
TEMPLATES_URL = "/api/admin/pages/templates/"


def manifest_with(block_type="text", settings=None):
    return {
        "schema_version": 1,
        "sections": [
            {
                "ordering": 0,
                "enabled": True,
                "layout": "full-width",
                "blocks": [
                    {
                        "block_type": block_type,
                        "ordering": 0,
                        "settings": settings
                        or {"body_fa": "متن", "body_en": "Text", "alignment": "start"},
                    }
                ],
            }
        ],
    }


def import_payload(manifest, *, dry_run=True, slug_en="template-draft"):
    return {
        "manifest": manifest,
        "dry_run": dry_run,
        "slug_fa": "پیش-نویس-الگو",
        "slug_en": slug_en,
        "title_fa": "پیش‌نویس الگو",
        "title_en": "Template draft",
        "page_type": "custom",
    }


def assert_problem(response):
    assert response.status_code in (400, 422)
    assert response["Content-Type"].startswith("application/problem+json")
    body = response.json()
    assert body["status"] == response.status_code
    assert body["detail"]
    assert body["instance"] == IMPORT_URL


def make_media(*, status="active"):
    return MediaAsset.objects.create(
        file="media/template.jpg",
        original_filename="template.jpg",
        mime_type="image/jpeg",
        file_size=123,
        checksum=f"checksum-{status}",
        status=status,
    )


@pytest.mark.django_db
def test_valid_dry_run_derives_manifest_and_writes_nothing(admin_client):
    response = admin_client.post(IMPORT_URL, import_payload(manifest_with()), format="json")

    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["manifest"]["block_types"] == ["text"]
    assert body["manifest"]["media_references"] == []
    assert body["manifest"]["translation_completeness"] == {"fa": True, "en": True}
    assert Page.objects.count() == 0
    assert Section.objects.count() == 0
    assert Block.objects.count() == 0


@pytest.mark.django_db
def test_real_import_creates_a_new_audited_draft_without_mutating_live_page(
    admin_client, admin_user
):
    live = Page.objects.create(
        slug_fa="زنده",
        slug_en="live",
        title_fa="زنده",
        title_en="Live",
        page_type="custom",
        status="published",
    )
    response = admin_client.post(
        IMPORT_URL,
        import_payload(manifest_with(), dry_run=False, slug_en="new-template-draft"),
        format="json",
    )

    assert response.status_code == 201
    imported = Page.objects.get(slug_en="new-template-draft")
    assert response.json()["page"]["id"] == str(imported.id)
    assert imported.status == "draft"
    assert imported.published_at is None
    assert imported.created_by == admin_user.get_username()
    assert imported.updated_by == admin_user.get_username()
    assert imported.sections.count() == 1
    assert imported.sections.get().blocks.get().block_type == "text"
    live.refresh_from_db()
    assert live.status == "published"
    assert live.sections.count() == 0


@pytest.mark.django_db
@pytest.mark.parametrize(
    "manifest",
    [
        {"schema_version": 2, "sections": []},
        manifest_with("raw_html", {"html": "<script>alert(1)</script>"}),
        manifest_with("text", {"content": "<strong>raw</strong>", "alignment": "start"}),
        manifest_with("cta", {"label": "Bad", "url": "javascript:alert(1)", "variant": "primary"}),
        manifest_with("hero", {"title": "Hero", "media_id": "not-a-uuid"}),
    ],
    ids=["unknown-schema", "unknown-raw-html-block", "raw-html-content", "unsafe-url", "invalid-media-id"],
)
def test_invalid_manifest_returns_problem_details(admin_client, manifest):
    response = admin_client.post(IMPORT_URL, import_payload(manifest), format="json")
    assert_problem(response)


@pytest.mark.django_db
def test_archived_media_returns_problem_details(admin_client):
    media = make_media(status="archived")
    manifest = manifest_with("hero", {"title": "Hero", "media_id": str(media.id)})

    response = admin_client.post(IMPORT_URL, import_payload(manifest), format="json")

    assert_problem(response)


@pytest.mark.django_db
def test_caller_supplied_derived_fields_must_match_sections(admin_client):
    manifest = manifest_with()
    manifest["block_types"] = ["hero"]
    manifest["media_references"] = []

    response = admin_client.post(IMPORT_URL, import_payload(manifest), format="json")

    assert_problem(response)


@pytest.mark.django_db
def test_template_create_and_list_are_draft_audited_and_do_not_expose_ids(
    admin_client, admin_user
):
    response = admin_client.post(
        TEMPLATES_URL,
        {"name": "Bilingual text", "manifest": deepcopy(manifest_with())},
        format="json",
    )

    assert response.status_code == 201
    created = response.json()
    assert created["status"] == "draft"
    assert created["manifest"]["block_types"] == ["text"]
    assert "id" not in created

    from apps.cms.models import ComposerTemplate

    template = ComposerTemplate.objects.get()
    assert template.created_by == admin_user.get_username()
    assert template.updated_by == admin_user.get_username()

    listed = admin_client.get(TEMPLATES_URL)
    assert listed.status_code == 200
    assert listed.json()[0]["name"] == "Bilingual text"
    assert "id" not in listed.json()[0]


@pytest.mark.django_db
def test_unauthenticated_template_requests_are_denied(api_client):
    assert api_client.get(TEMPLATES_URL).status_code in (401, 403)
    response = api_client.post(IMPORT_URL, import_payload(manifest_with()), format="json")
    assert response.status_code in (401, 403)
