"""Media business logic services.

Provides upload validation, content-hash naming, MediaAsset creation,
media usage tracking, and soft-archive with usage impact checks.

Requirements:
- 5.1: MIME type, extension, and size validation
- 5.2: Content-hash naming for deduplication
- 5.3: Image dimension extraction on upload
- 5.5: Track media usage across CMS pages, blog articles, and portfolio items
- 5.6: Reversible media archive with usage impact check
- 12.4: Never expose internal file paths (use generated names)
"""

from __future__ import annotations

import hashlib
import logging
import os
from datetime import datetime
from uuid import UUID

from django.core.files.storage import default_storage
from PIL import Image

from apps.media.models import MediaAsset

logger = logging.getLogger(__name__)

# --- Constants -----------------------------------------------------------

ALLOWED_MIME_TYPES: dict[str, list[str]] = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "image/svg+xml": [".svg"],
    "application/pdf": [".pdf"],
    "video/mp4": [".mp4"],
}

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

# Image MIME types eligible for dimension extraction (excludes SVG — vector format)
IMAGE_MIME_TYPES: set[str] = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


# --- Exceptions ----------------------------------------------------------


class UploadValidationError(Exception):
    """Raised when an uploaded file fails validation checks."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__(f"Upload validation failed: {errors}")


# --- Validation ----------------------------------------------------------


def validate_upload(file) -> list[str]:
    """Validate MIME type, file extension, and file size.

    Args:
        file: A Django UploadedFile-like object with .content_type, .name, .size.

    Returns:
        List of error strings. Empty list means the file is valid.
    """
    errors: list[str] = []

    # MIME type check
    mime_type = file.content_type
    if mime_type not in ALLOWED_MIME_TYPES:
        errors.append(
            f"MIME type '{mime_type}' is not allowed. "
            f"Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES.keys()))}"
        )

    # Extension check
    _, ext = os.path.splitext(file.name)
    ext = ext.lower()
    if mime_type in ALLOWED_MIME_TYPES:
        allowed_extensions = ALLOWED_MIME_TYPES[mime_type]
        if ext not in allowed_extensions:
            errors.append(
                f"File extension '{ext}' does not match MIME type '{mime_type}'. "
                f"Expected: {', '.join(allowed_extensions)}"
            )

    # Size check
    if file.size > MAX_UPLOAD_SIZE:
        errors.append(
            f"File size {file.size} bytes exceeds maximum of "
            f"{MAX_UPLOAD_SIZE} bytes (10 MB)."
        )

    return errors


# --- Hashing -------------------------------------------------------------


def compute_checksum(file) -> str:
    """Compute SHA-256 hash of the file content.

    Reads file in chunks for memory efficiency, then resets the file
    pointer to the beginning so the file can be read again.

    Args:
        file: A file-like object supporting .read(size) and .seek(0).

    Returns:
        Hex digest string of the SHA-256 hash.
    """
    sha256 = hashlib.sha256()
    for chunk in file.chunks() if hasattr(file, "chunks") else iter(
        lambda: file.read(8192), b""
    ):
        sha256.update(chunk)
    file.seek(0)
    return sha256.hexdigest()


# --- Storage path --------------------------------------------------------


def generate_storage_path(checksum: str, extension: str) -> str:
    """Generate a content-hash-based file path.

    Format: media/YYYY/MM/{first-8-chars-of-hash}/{full-hash}{extension}

    This provides:
    - Deduplication via content-addressing
    - Avoidance of name collisions
    - Never exposes original filenames (Requirement 12.4)

    Args:
        checksum: SHA-256 hex digest of the file content.
        extension: File extension including the leading dot (e.g., '.jpg').

    Returns:
        Relative storage path string.
    """
    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    short_hash = checksum[:8]
    return f"media/{year}/{month}/{short_hash}/{checksum}{extension}"


# --- Image dimension extraction -------------------------------------------


def extract_image_dimensions(file, mime_type: str) -> tuple[int | None, int | None]:
    """Extract width and height from an image file using Pillow.

    Only raster image MIME types are processed (JPEG, PNG, WebP, GIF).
    SVG is excluded because it is a vector format without fixed pixel dimensions.

    The file pointer is reset after reading so the file can be used again
    for storage.

    Args:
        file: A file-like object supporting .read() and .seek(0).
        mime_type: The MIME type of the uploaded file.

    Returns:
        A (width, height) tuple for images, or (None, None) for non-images
        or if dimension extraction fails (e.g. corrupt file).
    """
    if mime_type not in IMAGE_MIME_TYPES:
        return None, None

    try:
        image = Image.open(file)
        width, height = image.size
        return width, height
    except Exception:
        # Corrupt or unreadable image should not crash the upload.
        logger.warning(
            "Failed to extract dimensions from uploaded file (mime=%s).",
            mime_type,
            exc_info=True,
        )
        return None, None
    finally:
        file.seek(0)


# --- Upload orchestration ------------------------------------------------


def upload_media(file, user_id: str = "") -> MediaAsset:
    """Upload a new media asset with validation.

    Steps:
    1. Validate (MIME, size, extension)
    2. Compute checksum
    3. Check for duplicate (same checksum already exists → return existing)
    4. Store file with hash-based name
    5. Extract image dimensions (width/height for raster images)
    6. Create MediaAsset record
    7. Return the created/existing asset

    Args:
        file: A Django UploadedFile-like object.
        user_id: Optional identifier for the uploading user.

    Returns:
        The created or existing MediaAsset instance.

    Raises:
        UploadValidationError: If validation fails.
    """
    # 1. Validate
    errors = validate_upload(file)
    if errors:
        raise UploadValidationError(errors)

    # 2. Compute checksum
    checksum = compute_checksum(file)

    # 3. Check for duplicate
    existing = MediaAsset.objects.filter(checksum=checksum, status="active").first()
    if existing:
        return existing

    # 4. Store file with hash-based name
    _, ext = os.path.splitext(file.name)
    ext = ext.lower()
    storage_path = generate_storage_path(checksum, ext)
    saved_path = default_storage.save(storage_path, file)

    # 5. Extract image dimensions (for raster image MIME types)
    width, height = extract_image_dimensions(file, file.content_type)

    # 6. Create MediaAsset record
    asset = MediaAsset.objects.create(
        file=saved_path,
        original_filename=file.name,
        mime_type=file.content_type,
        file_size=file.size,
        width=width,
        height=height,
        checksum=checksum,
        created_by=user_id,
        updated_by=user_id,
    )

    # 7. Return the created asset
    return asset


# --- Media usage tracking (Requirement 5.5) -------------------------------


def get_media_usage(media_id: UUID) -> list[dict]:
    """Track where a media asset is referenced across CMS pages.

    Scans CMS Block settings JSONField for occurrences of the media UUID
    in keys named 'media_id' (single reference) or 'media_ids' (list of
    references).

    This function currently checks CMS blocks only. It will be extended
    to include blog articles and portfolio case studies when those apps
    are created.

    Args:
        media_id: UUID of the MediaAsset to look up.

    Returns:
        List of usage records, each with:
        - type: "page" (will also include "article", "case_study" later)
        - id: UUID of the containing page
        - title: Human-readable title (English title of the page)
    """
    from apps.cms.models import Block

    media_id_str = str(media_id)
    usages: list[dict] = []
    seen_page_ids: set = set()

    # 1. Check blocks with settings.media_id == media_id_str (single ref)
    blocks_single = Block.objects.filter(
        settings__media_id=media_id_str
    ).select_related("section__page")

    for block in blocks_single:
        page = block.section.page
        if page.id not in seen_page_ids:
            seen_page_ids.add(page.id)
            usages.append({
                "type": "page",
                "id": page.id,
                "title": page.title_en or page.title_fa,
            })

    # 2. Check blocks with media_ids list containing the media_id_str
    blocks_list = Block.objects.filter(
        settings__media_ids__contains=[media_id_str]
    ).select_related("section__page")

    for block in blocks_list:
        page = block.section.page
        if page.id not in seen_page_ids:
            seen_page_ids.add(page.id)
            usages.append({
                "type": "page",
                "id": page.id,
                "title": page.title_en or page.title_fa,
            })

    # 3. Future: check blog ArticleBlock for media references
    # 4. Future: check portfolio CaseStudy gallery for media references

    return usages


def get_media_usage_count(media_id: UUID) -> int:
    """Return the total number of content items referencing a media asset.

    This is a convenience wrapper around get_media_usage for cases where
    only the count is needed (e.g., archive impact warnings).

    Args:
        media_id: UUID of the MediaAsset to count references for.

    Returns:
        Integer count of distinct content items referencing this asset.
    """
    return len(get_media_usage(media_id))


def get_orphan_media_ids() -> list[UUID]:
    """Return IDs of active media assets with zero references.

    Scans all active MediaAssets and checks each against CMS blocks to
    find assets that are not referenced anywhere. Useful for cleanup
    reporting (Requirement 5.7: orphan detection).

    Currently only checks CMS blocks. Will be extended when blog and
    portfolio apps are created.

    Returns:
        List of UUIDs for media assets that have no references.
    """
    from apps.cms.models import Block

    # Collect all media IDs referenced in any block settings
    referenced_ids: set[str] = set()

    # Query all blocks that have a media_id key in their settings
    blocks_with_media = Block.objects.exclude(
        settings={}
    ).values_list("settings", flat=True)

    for settings in blocks_with_media:
        if not isinstance(settings, dict):
            continue

        # Check for single media reference
        media_id_val = settings.get("media_id")
        if media_id_val and isinstance(media_id_val, str):
            referenced_ids.add(media_id_val)

        # Check for list of media references
        media_ids_val = settings.get("media_ids")
        if media_ids_val and isinstance(media_ids_val, list):
            for mid in media_ids_val:
                if isinstance(mid, str):
                    referenced_ids.add(mid)

    # Get all active media asset IDs
    active_asset_ids = MediaAsset.objects.filter(
        status="active"
    ).values_list("id", flat=True)

    # Find orphans: active assets not in the referenced set
    orphan_ids: list[UUID] = []
    for asset_id in active_asset_ids:
        if str(asset_id) not in referenced_ids:
            orphan_ids.append(asset_id)

    return orphan_ids


# --- Archive / Unarchive -------------------------------------------------


class MediaNotFoundError(Exception):
    """Raised when a media asset cannot be found by ID."""

    def __init__(self, media_id: UUID):
        self.media_id = media_id
        super().__init__(f"MediaAsset with id={media_id} not found.")


def archive_media(media_id: UUID, force: bool = False) -> dict:
    """Soft-archive a media asset with usage impact check.

    If the asset is referenced by CMS blocks and force=False, returns a
    warning instead of archiving. If force=True, archives regardless.

    Args:
        media_id: UUID of the MediaAsset to archive.
        force: If True, archive even when in use.

    Returns:
        A result dict:
        - On success: {"success": True, "asset": MediaAsset, "warning": None}
        - On warning (in use, not forced):
          {"success": False, "asset": MediaAsset, "warning": str, "usage_count": int}

    Raises:
        MediaNotFoundError: If no MediaAsset exists with the given ID.
    """
    try:
        asset = MediaAsset.objects.get(id=media_id)
    except MediaAsset.DoesNotExist:
        raise MediaNotFoundError(media_id)

    # Already archived — return success immediately
    if asset.status == "archived":
        return {"success": True, "asset": asset, "warning": None}

    # Check for usage in CMS blocks
    usages = get_media_usage(media_id)
    usage_count = len(usages)

    if usage_count > 0 and not force:
        page_word = "page" if usage_count == 1 else "pages"
        warning = f"Media is referenced by {usage_count} {page_word}"
        return {
            "success": False,
            "asset": asset,
            "warning": warning,
            "usage_count": usage_count,
        }

    # Archive the asset (soft delete — status change only)
    asset.status = "archived"
    asset.save(update_fields=["status", "updated_at"])

    return {"success": True, "asset": asset, "warning": None}


def unarchive_media(media_id: UUID) -> dict:
    """Restore a previously archived media asset back to active.

    Args:
        media_id: UUID of the MediaAsset to restore.

    Returns:
        A result dict: {"success": True, "asset": MediaAsset, "warning": None}

    Raises:
        MediaNotFoundError: If no MediaAsset exists with the given ID.
    """
    try:
        asset = MediaAsset.objects.get(id=media_id)
    except MediaAsset.DoesNotExist:
        raise MediaNotFoundError(media_id)

    # Already active — return success immediately
    if asset.status == "active":
        return {"success": True, "asset": asset, "warning": None}

    asset.status = "active"
    asset.save(update_fields=["status", "updated_at"])

    return {"success": True, "asset": asset, "warning": None}
