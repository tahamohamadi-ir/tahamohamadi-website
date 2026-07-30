"""Contact-message persistence and protected inbox contract."""

import pytest
from rest_framework import status
from rest_framework.test import APIClient


PUBLIC_CONTACT_URL = "/api/public/contact/"
CONTACT_MESSAGES_URL = "/api/admin/contact-messages/"
PAYLOAD = {
    "name": "Inbox User",
    "email": "inbox@example.com",
    "subject": "Research collaboration",
    "message": "A sufficiently long message for the protected inbox.",
}


@pytest.mark.django_db
def test_contact_submission_is_persisted_for_the_authenticated_admin_inbox(
    api_client: APIClient, admin_client: APIClient
):
    public_response = api_client.post(PUBLIC_CONTACT_URL, PAYLOAD, format="json")

    assert public_response.status_code == status.HTTP_200_OK
    assert "email" not in public_response.json()

    inbox_response = admin_client.get(
        CONTACT_MESSAGES_URL, {"status": "new", "search": "collaboration"}
    )

    assert inbox_response.status_code == status.HTTP_200_OK
    result = inbox_response.json()["results"][0]
    assert result["name"] == PAYLOAD["name"]
    assert result["email"] == PAYLOAD["email"]
    assert result["subject"] == PAYLOAD["subject"]
    assert result["status"] == "new"
    assert "message" not in result


@pytest.mark.django_db
def test_admin_can_mark_a_contact_message_read_then_archive_it(
    api_client: APIClient, admin_client: APIClient
):
    assert api_client.post(PUBLIC_CONTACT_URL, PAYLOAD, format="json").status_code == status.HTTP_200_OK
    message_id = admin_client.get(CONTACT_MESSAGES_URL).json()["results"][0]["id"]

    mark_read_response = admin_client.post(
        f"{CONTACT_MESSAGES_URL}{message_id}/mark-read/", format="json"
    )

    assert mark_read_response.status_code == status.HTTP_200_OK
    assert mark_read_response.json()["status"] == "read"

    archive_response = admin_client.post(
        f"{CONTACT_MESSAGES_URL}{message_id}/archive/", format="json"
    )

    assert archive_response.status_code == status.HTTP_200_OK
    assert archive_response.json()["status"] == "archived"


@pytest.mark.django_db
def test_admin_cannot_archive_a_new_contact_message_without_marking_it_read(
    api_client: APIClient, admin_client: APIClient
):
    assert api_client.post(PUBLIC_CONTACT_URL, PAYLOAD, format="json").status_code == status.HTTP_200_OK
    message_id = admin_client.get(CONTACT_MESSAGES_URL).json()["results"][0]["id"]

    response = admin_client.post(f"{CONTACT_MESSAGES_URL}{message_id}/archive/", format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
