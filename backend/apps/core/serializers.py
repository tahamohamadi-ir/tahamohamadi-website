"""Core serializers — public contact form."""

from rest_framework import serializers


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
