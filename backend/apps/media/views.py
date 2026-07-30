"""Media views.

Provides:
- ``AdminMediaViewSet`` — ModelViewSet for upload, list (paginated with
  search/filter), detail, update metadata, archive/unarchive.

Auth/CSRF enforcement: DRF defaults (SessionAuthentication + IsAuthenticated)
are applied globally.
"""

from __future__ import annotations

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from apps.core.exceptions import build_problem, PROBLEM_CONTENT_TYPE
from apps.core.throttling import UploadRateThrottle
from apps.media.models import MediaAsset
from apps.media.serializers import (
    MediaAssetSerializer,
    MediaAssetUpdateSerializer,
    MediaUploadSerializer,
)
from apps.media.services import (
    UploadValidationError,
    get_media_usage,
    get_orphan_media_ids,
    replace_media_references,
    upload_media,
)


class AdminMediaViewSet(ModelViewSet):
    """Admin CRUD for media assets.

    - list: paginated media with search (original_filename) and filter
            (mime_type, status)
    - retrieve: single asset detail
    - update/partial_update: metadata only (alt text, captions)
    - upload (custom POST action): uses upload_media service
    - archive (custom POST action): sets status to "archived"
    - unarchive (custom POST action): sets status to "active"

    Requirements: 5.8, 1.3
    """

    queryset = MediaAsset.objects.all().order_by("-created_at")
    filterset_fields = ["mime_type", "status"]
    search_fields = ["original_filename"]
    filter_backends = [DjangoFilterBackend, SearchFilter]

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return MediaAssetUpdateSerializer
        if self.action == "upload":
            return MediaUploadSerializer
        return MediaAssetSerializer

    # ------------------------------------------------------------------
    # Disable create via standard POST (use upload action instead)
    # ------------------------------------------------------------------

    def create(self, request, *args, **kwargs):
        problem = build_problem(
            status.HTTP_405_METHOD_NOT_ALLOWED,
            "Use the /upload/ action to upload media files.",
            instance=request.path,
        )
        return Response(
            problem,
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
            content_type=PROBLEM_CONTENT_TYPE,
        )

    # ------------------------------------------------------------------
    # Disable destroy (use archive instead)
    # ------------------------------------------------------------------

    def destroy(self, request, *args, **kwargs):
        problem = build_problem(
            status.HTTP_405_METHOD_NOT_ALLOWED,
            "Use the /archive/ action to soft-delete media assets.",
            instance=request.path,
        )
        return Response(
            problem,
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
            content_type=PROBLEM_CONTENT_TYPE,
        )

    # ------------------------------------------------------------------
    # Upload (custom action)
    # ------------------------------------------------------------------

    @action(detail=False, methods=["post"], url_path="upload", throttle_classes=[UploadRateThrottle])
    def upload(self, request):
        """Upload a new media file.

        Validates file presence, then delegates to upload_media service
        which handles MIME validation, hashing, deduplication, and storage.
        """
        serializer = MediaUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]

        try:
            asset = upload_media(file, user_id=str(request.user))
        except UploadValidationError as exc:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Upload validation failed.",
                instance=request.path,
                errors={"file": exc.errors},
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        output_serializer = MediaAssetSerializer(asset, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # Archive (custom action)
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        """Archive only unreferenced media, returning the usage impact otherwise."""
        with transaction.atomic():
            asset = MediaAsset.objects.select_for_update().get(pk=pk)

            if asset.status == "archived":
                problem = build_problem(
                    status.HTTP_400_BAD_REQUEST,
                    "Asset is already archived.",
                    instance=request.path,
                )
                return Response(
                    problem,
                    status=status.HTTP_400_BAD_REQUEST,
                    content_type=PROBLEM_CONTENT_TYPE,
                )

            usage = get_media_usage(asset.id)
            if usage:
                problem = build_problem(
                    status.HTTP_409_CONFLICT,
                    "Referenced media cannot be archived. Review its usage before replacing or removing references.",
                    instance=request.path,
                    extra={"usage_count": len(usage), "usage": usage},
                )
                return Response(
                    problem,
                    status=status.HTTP_409_CONFLICT,
                    content_type=PROBLEM_CONTENT_TYPE,
                )

            asset.status = "archived"
            asset.save(update_fields=["status", "updated_at"])

        serializer = MediaAssetSerializer(asset, context={"request": request})
        return Response(serializer.data)

    # ------------------------------------------------------------------
    # Unarchive (custom action)
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="unarchive")
    def unarchive(self, request, pk=None):
        """Set asset status to 'active'."""
        asset = self.get_object()

        if asset.status == "active":
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Asset is already active.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        asset.status = "active"
        asset.save(update_fields=["status", "updated_at"])

        serializer = MediaAssetSerializer(asset, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="replace")
    def replace(self, request, pk=None):
        """Replace every known reference, then archive the source asset."""
        replacement_id = request.data.get("replacement_media_id")
        if not replacement_id:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "replacement_media_id is required.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        with transaction.atomic():
            asset_ids = sorted([str(pk), str(replacement_id)])
            assets = {
                str(asset.id): asset
                for asset in MediaAsset.objects.select_for_update().filter(id__in=asset_ids)
            }
            source = assets.get(str(pk))
            replacement = assets.get(str(replacement_id))
            if source is None or replacement is None:
                problem = build_problem(
                    status.HTTP_404_NOT_FOUND,
                    "Media asset was not found.",
                    instance=request.path,
                )
                return Response(
                    problem,
                    status=status.HTTP_404_NOT_FOUND,
                    content_type=PROBLEM_CONTENT_TYPE,
                )
            if source.id == replacement.id:
                problem = build_problem(
                    status.HTTP_400_BAD_REQUEST,
                    "A media asset cannot replace itself.",
                    instance=request.path,
                )
                return Response(
                    problem,
                    status=status.HTTP_400_BAD_REQUEST,
                    content_type=PROBLEM_CONTENT_TYPE,
                )
            if source.status != "active" or replacement.status != "active":
                problem = build_problem(
                    status.HTTP_400_BAD_REQUEST,
                    "Both source and replacement media must be active.",
                    instance=request.path,
                )
                return Response(
                    problem,
                    status=status.HTTP_400_BAD_REQUEST,
                    content_type=PROBLEM_CONTENT_TYPE,
                )

            replaced_usage_count = replace_media_references(source.id, replacement.id)
            if get_media_usage(source.id):
                raise RuntimeError("Media replacement left unresolved references.")
            source.status = "archived"
            source.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "archived_asset": MediaAssetSerializer(source, context={"request": request}).data,
                "replacement_asset": MediaAssetSerializer(replacement, context={"request": request}).data,
                "replaced_usage_count": replaced_usage_count,
            }
        )

    # ------------------------------------------------------------------
    # Usage (custom action)
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get"], url_path="usage")
    def usage(self, request, pk=None):
        """Return content records that currently reference this asset."""
        asset = self.get_object()
        return Response(get_media_usage(asset.id))

    # ------------------------------------------------------------------
    # Orphans report (custom action)
    # ------------------------------------------------------------------

    @action(detail=False, methods=["get"], url_path="orphans")
    def orphans(self, request):
        """Return media assets with zero usage references.

        Calls get_orphan_media_ids() to identify assets not referenced by
        any CMS block, then returns a paginated list using the same format
        as the standard list endpoint.

        Requirements: 5.7
        """
        orphan_ids = get_orphan_media_ids()
        queryset = MediaAsset.objects.filter(id__in=orphan_ids).order_by("-created_at")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = MediaAssetSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = MediaAssetSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)
