"""Focused contracts for portable Composer Draft templates."""

from copy import deepcopy

import pytest
from django.contrib.contenttypes.models import ContentType

from apps.cms.models import Block, ComposerTemplate, Page, Section
from apps.media.models import MediaAsset
from apps.workflow.models import AuditEvent


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
    tracked_models = (Page, Section, Block, ComposerTemplate, AuditEvent)
    counts_before = {model: model.objects.count() for model in tracked_models}

    response = admin_client.post(IMPORT_URL, import_payload(manifest_with()), format="json")

    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["manifest"]["block_types"] == ["text"]
    assert body["manifest"]["media_references"] == []
    assert body["manifest"]["translation_completeness"] == {"fa": True, "en": True}
    assert {model: model.objects.count() for model in tracked_models} == counts_before


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
    audit_event = AuditEvent.objects.get()
    assert audit_event.content_type == ContentType.objects.get_for_model(Page)
    assert audit_event.object_id == imported.id
    assert audit_event.to_status == "import"
    assert audit_event.user == admin_user
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
@pytest.mark.parametrize(
    ("block_type", "settings"),
    [
        (
            "hero",
            {
                "heading_fa": "قهرمان",
                "heading_en": "Hero",
                "cta_link": "javascript:alert(1)",
            },
        ),
        (
            "parallax",
            {
                "title": "Parallax",
                "media_url": "data:text/html,bad",
                "speed": 0.5,
                "duration": 300,
                "delay": 0,
                "easing": "ease-out",
                "trigger": "scroll",
            },
        ),
        (
            "image_reveal",
            {
                "media_url": "javascript:alert(1)",
                "reveal_direction": "left",
                "duration": 300,
                "delay": 0,
                "easing": "ease-out",
                "trigger": "scroll",
            },
        ),
    ],
    ids=["legacy-hero-cta-link", "parallax-media-url", "image-reveal-media-url"],
)
def test_every_registered_url_field_rejects_unsafe_schemes(
    admin_client, block_type, settings
):
    response = admin_client.post(
        IMPORT_URL,
        import_payload(manifest_with(block_type, settings)),
        format="json",
    )

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
@pytest.mark.parametrize(
    ("field", "value", "remove"),
    [
        ("layout", None, False),
        ("layout", None, True),
        ("enabled", "true", False),
        ("enabled", None, True),
    ],
    ids=["layout-wrong-type", "layout-missing", "enabled-wrong-type", "enabled-missing"],
)
def test_template_create_rejects_unimportable_section_shape(
    admin_client, field, value, remove
):
    manifest = manifest_with()
    if remove:
        manifest["sections"][0].pop(field)
    else:
        manifest["sections"][0][field] = value

    response = admin_client.post(
        TEMPLATES_URL,
        {"name": "Invalid section", "manifest": manifest},
        format="json",
    )

    assert response.status_code == 400
    assert response["Content-Type"].startswith("application/problem+json")
    assert field in str(response.json()["errors"]["manifest"])
    assert not ComposerTemplate.objects.exists()


@pytest.mark.django_db
def test_template_create_and_list_are_draft_audited_and_expose_stable_ids(
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

    template = ComposerTemplate.objects.get()
    assert created["id"] == str(template.id)
    assert template.created_by == admin_user.get_username()
    assert template.updated_by == admin_user.get_username()
    audit_event = AuditEvent.objects.get()
    assert audit_event.content_type == ContentType.objects.get_for_model(ComposerTemplate)
    assert audit_event.object_id == template.id
    assert audit_event.to_status == "create"
    assert audit_event.user == admin_user

    listed = admin_client.get(TEMPLATES_URL)
    assert listed.status_code == 200
    assert listed.json()[0]["name"] == "Bilingual text"
    assert listed.json()[0]["id"] == str(template.id)


@pytest.mark.django_db
def test_unauthenticated_template_requests_are_denied(api_client):
    assert api_client.get(TEMPLATES_URL).status_code in (401, 403)
    response = api_client.post(IMPORT_URL, import_payload(manifest_with()), format="json")
    assert response.status_code in (401, 403)
