"""CMS service layer.

Business logic for page composition, block validation, and public projection.
"""

from __future__ import annotations

import re

from apps.cms.block_registry import BLOCK_SCHEMAS, is_known_block_type, validate_block_settings


# ---------------------------------------------------------------------------
# UUID pattern for media reference validation
# ---------------------------------------------------------------------------
_UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


def get_allowed_block_types() -> list[str]:
    """Return the sorted list of registered block type names.

    This is used by API endpoints to communicate allowed types to the frontend
    and by validation logic to reject unknown types.
    """
    return sorted(BLOCK_SCHEMAS.keys())


# ---------------------------------------------------------------------------
# URL safety validation (Req 12.2)
# ---------------------------------------------------------------------------

def is_safe_url(url: str) -> bool:
    """Check whether a CTA URL is safe.

    Safe URLs are:
    - Internal locale-aware paths starting with /fa/ or /en/ or just /
    - External HTTPS URLs starting with https://

    Everything else (javascript:, http://, data:, ftp:, etc.) is rejected.
    """
    if not url or not isinstance(url, str):
        return False

    url_stripped = url.strip()

    # Protocol-relative URLs (//example.com) are NOT safe
    if url_stripped.startswith("//"):
        return False

    # Internal paths: must start with / (but not //)
    if url_stripped.startswith("/"):
        return True

    # External HTTPS URLs
    if url_stripped.startswith("https://"):
        return True

    return False


# ---------------------------------------------------------------------------
# Media ID extraction
# ---------------------------------------------------------------------------

def extract_media_ids(settings: dict) -> list[str]:
    """Extract all media_id and media_ids references from block settings.

    Looks for:
    - 'media_id' key (single UUID string or None)
    - 'media_ids' key (list of UUID strings)

    Returns a list of all non-None media ID strings found.
    """
    ids: list[str] = []

    if not isinstance(settings, dict):
        return ids

    # Single media_id
    media_id = settings.get("media_id")
    if media_id is not None and isinstance(media_id, str) and media_id:
        ids.append(media_id)

    # List of media_ids
    media_ids = settings.get("media_ids")
    if isinstance(media_ids, list):
        for mid in media_ids:
            if isinstance(mid, str) and mid:
                ids.append(mid)

    return ids


# ---------------------------------------------------------------------------
# Page composition validation (Req 4.7)
# ---------------------------------------------------------------------------

def validate_page_composition(
    page_data: dict,
    known_media_ids: set[str] | None = None,
) -> list[str]:
    """Validate the entire page composition.

    Checks performed:
    a) Section ordering is contiguous (0-based or 1-based, no gaps/duplicates)
    b) Block ordering within each section is contiguous (no gaps/duplicates)
    c) Every block_type is from the allowed registry
    d) Each block's settings pass validate_block_settings
    e) Media references (media_id, media_ids) must look like valid UUIDs
    f) CTA URLs must be safe (internal locale-aware or HTTPS external)

    Args:
        page_data: Dict matching the PageSerializer input shape:
            {"sections": [{"ordering": int, "blocks": [...]}]}
        known_media_ids: Optional set of existing media UUIDs. When provided,
            referenced IDs are also checked for existence. When None, only
            UUID format is validated (keeps the function DB-free by default).

    Returns:
        A list of human-readable error strings. Empty list means valid.
    """
    errors: list[str] = []
    sections = page_data.get("sections")

    if sections is None:
        return errors

    if not isinstance(sections, list):
        errors.append("'sections' must be a list")
        return errors

    # --- (a) Validate section ordering ---
    section_orderings = [s.get("ordering") for s in sections if isinstance(s, dict)]
    ordering_errors = _validate_ordering(section_orderings, "Section")
    errors.extend(ordering_errors)

    # --- Per-section validation ---
    for sec_idx, section in enumerate(sections):
        if not isinstance(section, dict):
            errors.append(f"sections[{sec_idx}]: must be a dict")
            continue

        blocks = section.get("blocks")
        if blocks is None:
            continue

        if not isinstance(blocks, list):
            errors.append(f"sections[{sec_idx}].blocks: must be a list")
            continue

        # --- (b) Validate block ordering within section ---
        block_orderings = [b.get("ordering") for b in blocks if isinstance(b, dict)]
        block_ordering_errors = _validate_ordering(
            block_orderings, f"sections[{sec_idx}] block"
        )
        errors.extend(block_ordering_errors)

        # --- Per-block validation ---
        for blk_idx, block in enumerate(blocks):
            if not isinstance(block, dict):
                errors.append(f"sections[{sec_idx}].blocks[{blk_idx}]: must be a dict")
                continue

            block_type = block.get("block_type", "")
            settings = block.get("settings", {})
            path = f"sections[{sec_idx}].blocks[{blk_idx}]"

            # --- (c) Block type validation ---
            if not is_known_block_type(block_type):
                errors.append(f"{path}: unknown block_type '{block_type}'")
                continue  # skip further checks for unknown types

            # --- (d) Block settings validation ---
            if not isinstance(settings, dict):
                errors.append(f"{path}: settings must be a dict")
                continue

            settings_errors = validate_block_settings(block_type, settings)
            for err in settings_errors:
                errors.append(f"{path}: {err}")

            # --- (e) Media reference validation ---
            media_ids = extract_media_ids(settings)
            for mid in media_ids:
                if not _UUID_RE.match(mid):
                    errors.append(f"{path}: invalid media UUID '{mid}'")
                elif known_media_ids is not None and mid not in known_media_ids:
                    errors.append(f"{path}: media asset '{mid}' not found")

            # --- (f) URL safety validation ---
            # Check cta_url in hero blocks
            cta_url = settings.get("cta_url")
            if cta_url is not None and isinstance(cta_url, str) and cta_url:
                if not is_safe_url(cta_url):
                    errors.append(f"{path}: unsafe CTA URL '{cta_url}'")

            # Check url in cta blocks
            url = settings.get("url")
            if block_type == "cta" and url is not None and isinstance(url, str) and url:
                if not is_safe_url(url):
                    errors.append(f"{path}: unsafe CTA URL '{url}'")

    return errors


def _validate_ordering(orderings: list, label: str) -> list[str]:
    """Validate that orderings are contiguous with no gaps or duplicates.

    Accepts 0-based (0,1,2,...) or 1-based (1,2,3,...) sequences.
    """
    errors: list[str] = []

    if not orderings:
        return errors

    # Filter out non-integer orderings
    int_orderings = []
    for o in orderings:
        if not isinstance(o, int):
            errors.append(f"{label} ordering: expected integer, got {type(o).__name__}")
        else:
            int_orderings.append(o)

    if not int_orderings:
        return errors

    # Check for duplicates
    seen = set()
    for o in int_orderings:
        if o in seen:
            errors.append(f"{label} ordering: duplicate value {o}")
        seen.add(o)

    # Check contiguity: sorted values should form a contiguous range
    sorted_orderings = sorted(int_orderings)
    expected_start = sorted_orderings[0]
    for i, val in enumerate(sorted_orderings):
        if val != expected_start + i:
            errors.append(
                f"{label} ordering: gap detected — expected contiguous "
                f"sequence from {expected_start}, got {sorted_orderings}"
            )
            break

    return errors
