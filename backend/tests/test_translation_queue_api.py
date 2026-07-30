"""Contract tests for the Admin translation queue."""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.blog.models import Article


@pytest.mark.django_db
def test_translation_queue_returns_edit_path_and_real_localized_fields(
    admin_client: APIClient,
):
    """Removing a field pair or its edit target must break this contract."""
    now = timezone.now()
    article = Article.objects.create(
        slug_fa="صف-ترجمه",
        slug_en="translation-queue",
        title_fa="عنوان فارسی",
        title_en="English title",
        excerpt_fa="خلاصه فارسی",
        excerpt_en="English summary",
        status="draft",
        locale_updated_at={
            "fa": (now - timedelta(hours=3)).isoformat(),
            "en": (now - timedelta(hours=1)).isoformat(),
        },
    )

    response = admin_client.get("/api/admin/workflow/translation-status/")

    assert response.status_code == status.HTTP_200_OK
    item = next(row for row in response.json() if row["id"] == str(article.id))
    assert item["content_type"] == "blog.article"
    assert item["status_fa"] == "outdated"
    assert item["action_path"] == f"/admin/blog/{article.id}"
    assert item["fields"] == [
        {"key": "title", "label": "Title", "en": "English title", "fa": "عنوان فارسی"},
        {"key": "excerpt", "label": "Excerpt", "en": "English summary", "fa": "خلاصه فارسی"},
    ]
