"""Tests for Builder Page REST API."""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.pages.models import BuilderPage, BuilderPageDraft, BuilderPageVersion
from apps.pages.schema_validator import validate_builder_schema


@pytest.mark.django_db
class TestSchemaValidator:
    def test_valid_schema(self):
        schema = {
            "schemaVersion": "1.0.0",
            "rootNodeId": "root",
            "nodes": {
                "root": {
                    "id": "root",
                    "type": "core.page",
                    "slots": {},
                }
            },
        }
        errors = validate_builder_schema(schema)
        assert len(errors) == 0

    def test_invalid_schema_missing_root(self):
        schema = {
            "schemaVersion": "1.0.0",
            "rootNodeId": "root",
            "nodes": {},
        }
        errors = validate_builder_schema(schema)
        assert len(errors) > 0
        assert "Root node 'root' not found" in errors[0]


@pytest.mark.django_db
class TestBuilderPageModel:
    def test_create_builder_page(self):
        page = BuilderPage.objects.create(
            slug="test-landing-page",
            title="Test Landing Page",
            locale="fa-IR",
            direction="rtl",
        )
        draft = BuilderPageDraft.objects.create(
            page=page,
            schema={
                "schemaVersion": "1.0.0",
                "rootNodeId": "root",
                "nodes": {
                    "root": {
                        "id": "root",
                        "type": "core.page",
                        "slots": {},
                    }
                },
            },
        )
        assert page.slug == "test-landing-page"
        assert draft.revision == 0
        assert draft.content_hash != ""
