"""Tests for the media upload service (task 3.2, 3.3).

Covers:
- validate_upload: accepts valid files, rejects invalid MIME, oversized, mismatched ext
- compute_checksum: returns hex, is deterministic
- generate_storage_path: contains hash in path
- extract_image_dimensions: extracts width/height for images, returns None for non-images
"""

import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from apps.media.services import (
    ALLOWED_MIME_TYPES,
    IMAGE_MIME_TYPES,
    MAX_UPLOAD_SIZE,
    compute_checksum,
    extract_image_dimensions,
    generate_storage_path,
    validate_upload,
)


# --- validate_upload tests -----------------------------------------------


def test_validate_upload_accepts_valid_jpeg():
    """A valid JPEG file with correct extension and size should pass."""
    file = SimpleUploadedFile(
        name="photo.jpg",
        content=b"\xff\xd8\xff\xe0" + b"\x00" * 100,
        content_type="image/jpeg",
    )
    errors = validate_upload(file)
    assert errors == []


def test_validate_upload_accepts_valid_png():
    """A valid PNG file should pass validation."""
    file = SimpleUploadedFile(
        name="image.png",
        content=b"\x89PNG" + b"\x00" * 100,
        content_type="image/png",
    )
    errors = validate_upload(file)
    assert errors == []


def test_validate_upload_rejects_invalid_mime_type():
    """A file with an unsupported MIME type should be rejected."""
    file = SimpleUploadedFile(
        name="script.exe",
        content=b"\x00" * 100,
        content_type="application/x-msdownload",
    )
    errors = validate_upload(file)
    assert len(errors) >= 1
    assert "MIME type" in errors[0]
    assert "application/x-msdownload" in errors[0]


def test_validate_upload_rejects_oversized_file():
    """A file exceeding MAX_UPLOAD_SIZE should be rejected."""
    # Create a file that's just over the limit
    file = SimpleUploadedFile(
        name="big.jpg",
        content=b"\xff\xd8\xff\xe0" + b"\x00" * MAX_UPLOAD_SIZE,
        content_type="image/jpeg",
    )
    errors = validate_upload(file)
    assert len(errors) >= 1
    assert "exceeds maximum" in errors[0]


def test_validate_upload_rejects_mismatched_extension():
    """A file whose extension doesn't match its MIME type should be rejected."""
    file = SimpleUploadedFile(
        name="photo.png",  # Extension .png doesn't match image/jpeg
        content=b"\xff\xd8\xff\xe0" + b"\x00" * 100,
        content_type="image/jpeg",
    )
    errors = validate_upload(file)
    assert len(errors) >= 1
    assert "does not match" in errors[0]


def test_validate_upload_rejects_a_declared_jpeg_with_pdf_content():
    """The client-declared MIME type must not override the file signature."""
    file = SimpleUploadedFile(
        name="disguised.jpg",
        content=b"%PDF-1.7\nnot actually a JPEG",
        content_type="image/jpeg",
    )

    errors = validate_upload(file)

    assert any("does not match detected content" in error for error in errors)


# --- compute_checksum tests ----------------------------------------------


def test_compute_checksum_returns_hex_string():
    """Checksum should be a 64-char hex string (SHA-256)."""
    file = SimpleUploadedFile(
        name="test.jpg",
        content=b"hello world content",
        content_type="image/jpeg",
    )
    result = compute_checksum(file)
    assert isinstance(result, str)
    assert len(result) == 64
    # Should be valid hex
    int(result, 16)


def test_compute_checksum_is_deterministic():
    """Same content should always produce the same checksum."""
    content = b"deterministic test content 12345"
    file1 = SimpleUploadedFile(name="a.jpg", content=content, content_type="image/jpeg")
    file2 = SimpleUploadedFile(name="b.jpg", content=content, content_type="image/jpeg")

    checksum1 = compute_checksum(file1)
    checksum2 = compute_checksum(file2)
    assert checksum1 == checksum2


def test_compute_checksum_resets_file_position():
    """After computing checksum, file pointer should be at position 0."""
    file = SimpleUploadedFile(
        name="test.jpg",
        content=b"some file content",
        content_type="image/jpeg",
    )
    compute_checksum(file)
    # File should be readable again from the beginning
    assert file.read() == b"some file content"


# --- generate_storage_path tests -----------------------------------------


def test_generate_storage_path_contains_hash():
    """The generated path should contain the full hash and short hash prefix."""
    checksum = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    extension = ".jpg"

    path = generate_storage_path(checksum, extension)

    # Should start with media/
    assert path.startswith("media/")
    # Should contain the full checksum
    assert checksum in path
    # Should contain the short hash (first 8 chars) as a directory
    assert "abcdef12" in path
    # Should end with the extension
    assert path.endswith(".jpg")


def test_generate_storage_path_includes_date_components():
    """Path should include year and month directories."""
    checksum = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    extension = ".png"

    path = generate_storage_path(checksum, extension)

    parts = path.split("/")
    # media/YYYY/MM/shorthash/fullhash.ext
    assert len(parts) == 5
    assert parts[0] == "media"
    assert len(parts[1]) == 4  # YYYY
    assert len(parts[2]) == 2  # MM
    assert parts[1].isdigit()
    assert parts[2].isdigit()


# --- extract_image_dimensions tests --------------------------------------


def _make_image_file(
    width: int = 200, height: int = 150, fmt: str = "JPEG", ext: str = ".jpg", mime: str = "image/jpeg"
) -> SimpleUploadedFile:
    """Helper to create a real in-memory image file via Pillow."""
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color=(255, 0, 0))
    img.save(buf, format=fmt)
    buf.seek(0)
    return SimpleUploadedFile(
        name=f"test{ext}",
        content=buf.read(),
        content_type=mime,
    )


def test_extract_image_dimensions_jpeg():
    """Should extract correct dimensions for a JPEG image."""
    file = _make_image_file(width=800, height=600, fmt="JPEG", mime="image/jpeg")
    width, height = extract_image_dimensions(file, "image/jpeg")
    assert width == 800
    assert height == 600


def test_extract_image_dimensions_png():
    """Should extract correct dimensions for a PNG image."""
    file = _make_image_file(width=1024, height=768, fmt="PNG", ext=".png", mime="image/png")
    width, height = extract_image_dimensions(file, "image/png")
    assert width == 1024
    assert height == 768


def test_extract_image_dimensions_webp():
    """Should extract correct dimensions for a WebP image."""
    file = _make_image_file(width=500, height=500, fmt="WEBP", ext=".webp", mime="image/webp")
    width, height = extract_image_dimensions(file, "image/webp")
    assert width == 500
    assert height == 500


def test_extract_image_dimensions_gif():
    """Should extract correct dimensions for a GIF image."""
    file = _make_image_file(width=320, height=240, fmt="GIF", ext=".gif", mime="image/gif")
    width, height = extract_image_dimensions(file, "image/gif")
    assert width == 320
    assert height == 240


def test_extract_image_dimensions_non_image_returns_none():
    """Non-image MIME types should return (None, None)."""
    file = SimpleUploadedFile(
        name="document.pdf",
        content=b"%PDF-1.4 some content here",
        content_type="application/pdf",
    )
    width, height = extract_image_dimensions(file, "application/pdf")
    assert width is None
    assert height is None


def test_extract_image_dimensions_svg_returns_none():
    """SVG (vector format) should return (None, None) — excluded from extraction."""
    svg_content = b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>'
    file = SimpleUploadedFile(
        name="icon.svg",
        content=svg_content,
        content_type="image/svg+xml",
    )
    width, height = extract_image_dimensions(file, "image/svg+xml")
    assert width is None
    assert height is None


def test_extract_image_dimensions_corrupt_image_returns_none():
    """A corrupt image file should not crash; returns (None, None)."""
    file = SimpleUploadedFile(
        name="corrupt.jpg",
        content=b"this is not a real image at all",
        content_type="image/jpeg",
    )
    width, height = extract_image_dimensions(file, "image/jpeg")
    assert width is None
    assert height is None


def test_extract_image_dimensions_resets_file_pointer():
    """After extraction, the file pointer should be at position 0."""
    file = _make_image_file(width=100, height=100)
    extract_image_dimensions(file, "image/jpeg")
    # File should be readable from the start
    content = file.read()
    assert len(content) > 0
