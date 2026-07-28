"""Media serializers (DTOs).

Provides:
- ``MediaAssetSerializer``: Full read serializer for list/detail responses.
- ``MediaAssetUpdateSerializer``: Writable fields for metadata updates.
- ``MediaUploadSerializer``: Validates the uploaded file field.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.media.models import MediaAsset


class MediaAssetSerializer(serializers.ModelSerializer):
    """Full read-only serializer for MediaAsset list and detail views."""

    file = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = [
            "id",
            "file",
            "original_filename",
            "mime_type",
            "file_size",
            "width",
            "height",
            "alt_text_fa",
            "alt_text_en",
            "caption_fa",
            "caption_en",
            "status",
            "checksum",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_file(self, obj: MediaAsset) -> str | None:
        """Return the file URL (not the internal storage path)."""
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class MediaAssetUpdateSerializer(serializers.ModelSerializer):
    """Serializer for metadata-only updates (alt text, captions)."""

    class Meta:
        model = MediaAsset
        fields = [
            "alt_text_fa",
            "alt_text_en",
            "caption_fa",
            "caption_en",
        ]


class MediaUploadSerializer(serializers.Serializer):
    """Validates the uploaded file field for the upload action."""

    file = serializers.FileField()
