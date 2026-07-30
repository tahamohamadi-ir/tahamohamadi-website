"""Public contact endpoint safety contract."""

from unittest.mock import patch

import pytest
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient


PAYLOAD = {
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Collaboration",
    "message": "A sufficiently long and valid message.",
}


@pytest.fixture(autouse=True)
def clear_contact_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_contact_honeypot_returns_success_without_sending_email():
    payload = {**PAYLOAD, "website": "https://bot.example"}

    with patch("apps.core.views.send_mail") as send_mail:
        response = APIClient().post("/api/public/contact/", payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "sent"
    send_mail.assert_not_called()


@pytest.mark.django_db
def test_contact_rejects_submissions_over_the_dedicated_limit():
    client = APIClient()

    for _ in range(6):
        assert client.get("/api/public/contact/").status_code == status.HTTP_200_OK
    for _ in range(5):
        assert client.post("/api/public/contact/", PAYLOAD, format="json").status_code == status.HTTP_200_OK
    response = client.post("/api/public/contact/", PAYLOAD, format="json")

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
