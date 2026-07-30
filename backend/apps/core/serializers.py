"""Core serializers — public contact form."""

from rest_framework import serializers

from apps.core.models import ContactMessage


class ContactMessageSerializer(serializers.Serializer):
    """Validates incoming contact form submissions.

    Fields:
    - name: 2–100 characters
    - email: valid email
    - subject: 2–200 characters
    - message: 10–5000 characters
    """

    name = serializers.CharField(min_length=2, max_length=100)
    email = serializers.EmailField()
    subject = serializers.CharField(min_length=2, max_length=200)
    message = serializers.CharField(min_length=10, max_length=5000)
    website = serializers.CharField(required=False, allow_blank=True, max_length=256, trim_whitespace=True)


class ContactMessageInboxSerializer(serializers.ModelSerializer):
    """Summary projection that deliberately excludes the private message body."""

    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "subject", "status", "created_at"]
        read_only_fields = fields


class ContactMessageDetailSerializer(ContactMessageInboxSerializer):
    """Full message content, available only from the authenticated detail route."""

    class Meta(ContactMessageInboxSerializer.Meta):
        fields = [*ContactMessageInboxSerializer.Meta.fields, "message"]


class ContactMessageTransitionSerializer(serializers.ModelSerializer):
    """Small response payload for inbox state changes."""

    class Meta:
        model = ContactMessage
        fields = ["id", "status"]
        read_only_fields = fields
