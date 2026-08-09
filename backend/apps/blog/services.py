"""Blog business-logic services.

Content sanitization for article blocks (Req 6.4, 12.1).
Ensures no raw HTML, script tags, or unsafe URLs are stored.
"""

from __future__ import annotations

import re

from django.core.exceptions import ValidationError


# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------

# Matches any HTML tag (opening, closing, self-closing)
_HTML_TAG_RE = re.compile(r"<[^>]+>")

# Matches dangerous content that MUST be rejected outright
_DANGEROUS_RE = re.compile(
    r"<\s*script|<\s*iframe|javascript\s*:|data\s*:",
    re.IGNORECASE,
)

# UUID format for media IDs
_UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)

# Block types whose text content should be sanitized
_TEXT_BLOCK_TYPES = frozenset(
    {"paragraph", "heading", "list", "caption", "quote", "callout"}
)

# Block types that reference media
_MEDIA_BLOCK_TYPES = frozenset({"image", "gallery"})

ARTICLE_DOCUMENT_VERSION = 1
ARTICLE_BLOCK_TYPES = frozenset(
    {
        "paragraph",
        "heading",
        "list",
        "image",
        "gallery",
        "quote",
        "code",
        "divider",
        "callout",
        "reference",
    }
)
ARTICLE_CODE_LANGUAGES = frozenset(
    {
        "",
        "bash",
        "css",
        "html",
        "javascript",
        "json",
        "jsx",
        "markdown",
        "plaintext",
        "python",
        "shell",
        "sql",
        "tsx",
        "typescript",
        "yaml",
    }
)


# ---------------------------------------------------------------------------
# URL safety (reuses the same logic as apps.cms.services.is_safe_url)
# ---------------------------------------------------------------------------

def is_safe_url(url: str) -> bool:
    """Check whether a URL is safe for article content.

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
# Text sanitization helpers
# ---------------------------------------------------------------------------

def _contains_dangerous_content(text: str) -> bool:
    """Return True if text contains script, iframe, javascript:, or data: URLs."""
    return bool(_DANGEROUS_RE.search(text))


def _strip_html_tags(text: str) -> str:
    """Remove all HTML tags from text content."""
    return _HTML_TAG_RE.sub("", text)


# ---------------------------------------------------------------------------
# Block-level sanitization
# ---------------------------------------------------------------------------

def sanitize_block_content(block_type: str, content: dict) -> dict:
    """Sanitize a single article block's content.

    Args:
        block_type: The type of block (paragraph, heading, image, etc.)
        content: The block's content dict.

    Returns:
        Sanitized content dict.

    Raises:
        ValidationError: If content contains dangerous patterns that cannot
            be safely stripped (script tags, javascript: URLs, etc.).
    """
    if not isinstance(content, dict):
        raise ValidationError(f"Block content must be a dict, got {type(content).__name__}")

    # Code blocks are displayed as-is (not rendered), allow content unchanged
    if block_type == "code":
        return content

    # Divider blocks have no text content to sanitize
    if block_type == "divider":
        return content

    # Text blocks: sanitize text fields
    if block_type in _TEXT_BLOCK_TYPES:
        return _sanitize_text_block(block_type, content)

    # Media blocks: validate media references
    if block_type in _MEDIA_BLOCK_TYPES:
        return _sanitize_media_block(block_type, content)

    # Reference blocks: validate URL safety
    if block_type == "reference":
        return _sanitize_reference_block(content)

    # Unknown block types: strip HTML from all string values as a safety net
    return _sanitize_unknown_block(content)


def _sanitize_text_block(block_type: str, content: dict) -> dict:
    """Sanitize text-based blocks (paragraph, heading, list, caption, quote, callout)."""
    sanitized = {}

    for key, value in content.items():
        if isinstance(value, str):
            # Reject dangerous content outright
            if _contains_dangerous_content(value):
                raise ValidationError(
                    f"Dangerous content detected in {block_type} block field '{key}': "
                    "script tags, iframes, javascript:, and data: URLs are not allowed."
                )
            # Strip any remaining HTML tags
            sanitized[key] = _strip_html_tags(value)
        elif isinstance(value, list):
            # Handle list items (e.g., list block with items array)
            sanitized[key] = _sanitize_list_values(block_type, key, value)
        else:
            sanitized[key] = value

    return sanitized


def _sanitize_list_values(block_type: str, field: str, items: list) -> list:
    """Sanitize a list of values (e.g., list block items)."""
    sanitized_items = []
    for item in items:
        if isinstance(item, str):
            if _contains_dangerous_content(item):
                raise ValidationError(
                    f"Dangerous content detected in {block_type} block field '{field}': "
                    "script tags, iframes, javascript:, and data: URLs are not allowed."
                )
            sanitized_items.append(_strip_html_tags(item))
        elif isinstance(item, dict):
            # Recursively sanitize dict items in lists
            sanitized_items.append(_sanitize_text_block(block_type, item))
        else:
            sanitized_items.append(item)
    return sanitized_items


def _sanitize_media_block(block_type: str, content: dict) -> dict:
    """Keep only media references and non-derived presentation settings."""
    sanitized = {}

    # Validate single media_id
    media_id = content.get("media_id")
    if media_id is not None:
        if not isinstance(media_id, str) or not _UUID_RE.match(media_id):
            raise ValidationError(
                f"Invalid media_id in {block_type} block: must be a valid UUID."
            )
        sanitized["media_id"] = media_id

    # Validate media_ids list
    media_ids = content.get("media_ids")
    if media_ids is not None:
        if not isinstance(media_ids, list):
            raise ValidationError(
                f"media_ids in {block_type} block must be a list."
            )
        for idx, mid in enumerate(media_ids):
            if not isinstance(mid, str) or not _UUID_RE.match(mid):
                raise ValidationError(
                    f"Invalid media_ids[{idx}] in {block_type} block: must be a valid UUID."
                )
        sanitized["media_ids"] = list(media_ids)

    if block_type == "gallery" and "layout" in content:
        sanitized["layout"] = content["layout"]

    return sanitized


def _sanitize_reference_block(content: dict) -> dict:
    """Validate reference blocks have safe URLs."""
    sanitized = dict(content)

    url = content.get("url")
    if url is not None:
        if not isinstance(url, str):
            raise ValidationError("Reference block 'url' must be a string.")
        if _contains_dangerous_content(url):
            raise ValidationError(
                "Dangerous content detected in reference block URL: "
                "javascript: and data: URLs are not allowed."
            )
        if not is_safe_url(url):
            raise ValidationError(
                f"Unsafe URL in reference block: '{url}'. "
                "URLs must be internal paths (/...) or HTTPS."
            )

    # Sanitize text fields
    for key, value in content.items():
        if key == "url":
            continue
        if isinstance(value, str):
            if _contains_dangerous_content(value):
                raise ValidationError(
                    f"Dangerous content detected in reference block field '{key}'."
                )
            sanitized[key] = _strip_html_tags(value)

    return sanitized


def _sanitize_unknown_block(content: dict) -> dict:
    """Safety net: strip HTML from all string values in unknown block types."""
    sanitized = {}
    for key, value in content.items():
        if isinstance(value, str):
            if _contains_dangerous_content(value):
                raise ValidationError(
                    f"Dangerous content detected in block field '{key}'."
                )
            sanitized[key] = _strip_html_tags(value)
        else:
            sanitized[key] = value
    return sanitized


# ---------------------------------------------------------------------------
# Article-level sanitization
# ---------------------------------------------------------------------------

def sanitize_article_blocks(blocks: list[dict]) -> tuple[list[dict], list[str]]:
    """Sanitize all blocks in an article.

    Args:
        blocks: List of block dicts, each with 'block_type' and 'content' keys.

    Returns:
        Tuple of (sanitized_blocks, warnings).
        - sanitized_blocks: blocks with content sanitized
        - warnings: informational messages (e.g., HTML was stripped)

    Raises:
        ValidationError: If any block contains dangerous content (script tags,
            javascript: URLs, etc.) that cannot be safely handled.
    """
    if not isinstance(blocks, list):
        raise ValidationError("Article blocks must be a list.")

    sanitized_blocks: list[dict] = []
    warnings: list[str] = []

    for idx, block in enumerate(blocks):
        if not isinstance(block, dict):
            raise ValidationError(f"blocks[{idx}]: must be a dict.")

        block_type = block.get("block_type", "")
        content = block.get("content", {})

        if not isinstance(block_type, str) or not block_type:
            raise ValidationError(f"blocks[{idx}]: 'block_type' is required and must be a non-empty string.")

        if block_type not in ARTICLE_BLOCK_TYPES:
            raise ValidationError(
                f"blocks[{idx}]: unsupported block_type '{block_type}' "
                f"for document-v{ARTICLE_DOCUMENT_VERSION}."
            )

        if not isinstance(content, dict):
            raise ValidationError(f"blocks[{idx}]: 'content' must be a dict.")

        if block_type == "code":
            code_errors = _validate_code_content(idx, content)
            if code_errors:
                raise ValidationError(code_errors)

        # Check if content contains HTML before sanitization (for warnings)
        original_content_str = str(content)
        has_html = bool(_HTML_TAG_RE.search(original_content_str))

        try:
            sanitized_content = sanitize_block_content(block_type, content)
        except ValidationError:
            # Re-raise with block index context
            raise

        # Emit warning if HTML was stripped
        if has_html and block_type != "code":
            sanitized_content_str = str(sanitized_content)
            if original_content_str != sanitized_content_str:
                warnings.append(
                    f"blocks[{idx}] ({block_type}): HTML tags were stripped from content."
                )

        sanitized_block = dict(block)
        sanitized_block["content"] = sanitized_content
        sanitized_blocks.append(sanitized_block)

    return sanitized_blocks, warnings


# ---------------------------------------------------------------------------
# Validation-only (no modification)
# ---------------------------------------------------------------------------

def validate_article_content(
    blocks: list[dict], known_media_ids: set[str] | None = None
) -> list[str]:
    """Validate article blocks without modifying them.

    Returns a list of validation error strings. Empty list means valid.

    Checks for:
    - Script tags in any text content
    - Raw HTML in text fields
    - Unsafe URLs in reference blocks
    - Invalid media references (non-UUID format)
    """
    if not isinstance(blocks, list):
        return ["Article blocks must be a list."]

    errors: list[str] = []

    for idx, block in enumerate(blocks):
        if not isinstance(block, dict):
            errors.append(f"blocks[{idx}]: must be a dict.")
            continue

        block_type = block.get("block_type", "")
        content = block.get("content", {})

        if not isinstance(block_type, str) or not block_type:
            errors.append(f"blocks[{idx}]: 'block_type' is required.")
            continue

        if not isinstance(content, dict):
            errors.append(f"blocks[{idx}]: 'content' must be a dict.")
            continue

        if block_type not in ARTICLE_BLOCK_TYPES:
            errors.append(
                f"blocks[{idx}]: unsupported block_type '{block_type}' "
                f"for document-v{ARTICLE_DOCUMENT_VERSION}."
            )
            continue

        # Check text fields for dangerous/HTML content
        if block_type in _TEXT_BLOCK_TYPES:
            errors.extend(_validate_text_content(idx, block_type, content))

        # Check media blocks for valid UUIDs
        elif block_type in _MEDIA_BLOCK_TYPES:
            errors.extend(
                _validate_media_content(
                    idx, block_type, content, known_media_ids=known_media_ids
                )
            )

        # Check reference blocks for URL safety
        elif block_type == "reference":
            errors.extend(_validate_reference_content(idx, content))

        elif block_type == "code":
            errors.extend(_validate_code_content(idx, content))

    return errors


def _validate_text_content(idx: int, block_type: str, content: dict) -> list[str]:
    """Validate text content fields for dangerous patterns and raw HTML."""
    errors: list[str] = []

    for key, value in content.items():
        if isinstance(value, str):
            if _contains_dangerous_content(value):
                errors.append(
                    f"blocks[{idx}] ({block_type}): dangerous content in field '{key}' "
                    "(script, iframe, javascript:, or data: detected)."
                )
            elif _HTML_TAG_RE.search(value):
                errors.append(
                    f"blocks[{idx}] ({block_type}): raw HTML detected in field '{key}'."
                )
        elif isinstance(value, list):
            for item_idx, item in enumerate(value):
                if isinstance(item, str):
                    if _contains_dangerous_content(item):
                        errors.append(
                            f"blocks[{idx}] ({block_type}): dangerous content in "
                            f"field '{key}[{item_idx}]'."
                        )
                    elif _HTML_TAG_RE.search(item):
                        errors.append(
                            f"blocks[{idx}] ({block_type}): raw HTML in "
                            f"field '{key}[{item_idx}]'."
                        )

    return errors


def _validate_media_content(
    idx: int,
    block_type: str,
    content: dict,
    known_media_ids: set[str] | None = None,
) -> list[str]:
    """Validate media block references."""
    errors: list[str] = []

    media_id = content.get("media_id")
    if block_type == "image" and media_id is None:
        errors.append(f"blocks[{idx}] (image): media_id is required.")
    elif media_id is not None:
        if not isinstance(media_id, str) or not _UUID_RE.match(media_id):
            errors.append(
                f"blocks[{idx}] ({block_type}): invalid media_id (must be UUID)."
            )
        elif known_media_ids is not None and media_id not in known_media_ids:
            errors.append(
                f"blocks[{idx}] ({block_type}): media_id does not reference "
                "an active MediaAsset."
            )

    media_ids = content.get("media_ids")
    if block_type == "gallery" and media_ids is None:
        errors.append(f"blocks[{idx}] (gallery): media_ids is required.")
    elif media_ids is not None:
        if not isinstance(media_ids, list):
            errors.append(f"blocks[{idx}] ({block_type}): media_ids must be a list.")
        else:
            for mid_idx, mid in enumerate(media_ids):
                if not isinstance(mid, str) or not _UUID_RE.match(mid):
                    errors.append(
                        f"blocks[{idx}] ({block_type}): invalid media_ids[{mid_idx}] "
                        "(must be UUID)."
                    )
                elif known_media_ids is not None and mid not in known_media_ids:
                    errors.append(
                        f"blocks[{idx}] ({block_type}): media_ids[{mid_idx}] does "
                        "not reference an active MediaAsset."
                    )

    if block_type == "gallery" and content.get("layout", "grid") not in (
        "grid",
        "carousel",
    ):
        errors.append(
            f"blocks[{idx}] (gallery): layout must be 'grid' or 'carousel'."
        )

    return errors


def _validate_code_content(idx: int, content: dict) -> list[str]:
    """Validate code text and its bounded display-language label."""
    errors: list[str] = []
    code = content.get("code", "")
    language = content.get("language", "")

    if not isinstance(code, str):
        errors.append(f"blocks[{idx}] (code): 'code' must be a string.")
    if language is None:
        language = ""
    if not isinstance(language, str):
        errors.append(f"blocks[{idx}] (code): 'language' must be a string.")
    elif language.lower() not in ARTICLE_CODE_LANGUAGES:
        errors.append(
            f"blocks[{idx}] (code): unsupported language '{language}'."
        )

    return errors


def _validate_reference_content(idx: int, content: dict) -> list[str]:
    """Validate reference block URL safety."""
    errors: list[str] = []

    url = content.get("url")
    if url is not None:
        if not isinstance(url, str):
            errors.append(f"blocks[{idx}] (reference): 'url' must be a string.")
        elif _contains_dangerous_content(url):
            errors.append(
                f"blocks[{idx}] (reference): dangerous URL detected "
                "(javascript: or data:)."
            )
        elif not is_safe_url(url):
            errors.append(
                f"blocks[{idx}] (reference): unsafe URL '{url}' "
                "(must be internal path or HTTPS)."
            )

    # Also check text fields for dangerous content
    for key, value in content.items():
        if key == "url":
            continue
        if isinstance(value, str):
            if _contains_dangerous_content(value):
                errors.append(
                    f"blocks[{idx}] (reference): dangerous content in field '{key}'."
                )
            elif _HTML_TAG_RE.search(value):
                errors.append(
                    f"blocks[{idx}] (reference): raw HTML detected in field '{key}'."
                )

    return errors


def project_article_blocks(
    blocks: list[dict], media_assets: dict[str, object], locale: str
) -> list[dict]:
    """Return safe document-v1 blocks with localized active-media projections."""
    known_media_ids = set(media_assets)
    projected: list[dict] = []

    for block in blocks:
        if validate_article_content([block], known_media_ids=known_media_ids):
            continue

        sanitized, _warnings = sanitize_article_blocks([block])
        output = sanitized[0]
        content = dict(output["content"])

        if output["block_type"] == "image":
            asset = media_assets[content["media_id"]]
            content.update(_project_media_asset(asset, locale))
        elif output["block_type"] == "gallery":
            content["items"] = [
                {
                    "media_id": media_id,
                    **_project_media_asset(media_assets[media_id], locale),
                }
                for media_id in content["media_ids"]
            ]

        output["content"] = content
        projected.append(output)

    return projected


def _project_media_asset(asset: object, locale: str) -> dict:
    file_field = getattr(asset, "file", None)
    return {
        "url": file_field.url if file_field else None,
        "alt": getattr(asset, f"alt_text_{locale}", ""),
        "caption": getattr(asset, f"caption_{locale}", ""),
        "width": getattr(asset, "width", None),
        "height": getattr(asset, "height", None),
    }


def _validate_generic_content(idx: int, block_type: str, content: dict) -> list[str]:
    """Validate unknown block types for dangerous content."""
    errors: list[str] = []

    for key, value in content.items():
        if isinstance(value, str):
            if _contains_dangerous_content(value):
                errors.append(
                    f"blocks[{idx}] ({block_type}): dangerous content in field '{key}'."
                )

    return errors


# ---------------------------------------------------------------------------
# Markdown Import Service (Requirement 6.6)
# ---------------------------------------------------------------------------

# Regex patterns for Markdown elements
_RE_HEADING = re.compile(r"^(#{1,6})\s+(.+)$")
_RE_HORIZONTAL_RULE = re.compile(r"^(?:---+|\*\*\*+|___+)\s*$")
_RE_IMAGE = re.compile(r"^!\[([^\]]*)\]\(([^)]+)\)\s*$")
_RE_BLOCKQUOTE = re.compile(r"^>\s?(.*)")
_RE_CODE_FENCE = re.compile(r"^```(\w*)\s*$")
_RE_UNORDERED_LIST = re.compile(r"^[\-\*\+]\s+(.*)")
_RE_ORDERED_LIST = re.compile(r"^\d+\.\s+(.*)")
_RE_TASK_LIST = re.compile(r"^[\-\*\+]\s+\[[ xX]\]\s+(.*)")
_RE_HTML_TAG = re.compile(r"<(/?)(\w+)[^>]*>")
_RE_TABLE_SEPARATOR = re.compile(r"^\|?[\s\-:|]+\|[\s\-:|]*$")
_RE_TABLE_ROW = re.compile(r"^\|(.+)\|\s*$")
_RE_FOOTNOTE = re.compile(r"^\[\^([^\]]+)\]:\s*(.*)")
_RE_INLINE_LINK_COMPLEX = re.compile(
    r'\[([^\]]+)\]\(([^)]+)\s+"[^"]*"\)'
)


def import_markdown(
    markdown_text: str, locale: str
) -> tuple[list[dict], list[str]]:
    """Parse Markdown text and convert to a list of ArticleBlock dicts.

    Returns a tuple of (blocks, warnings) where:
    - blocks: list of dicts with keys block_type, content, ordering, locale
    - warnings: list of human-readable warning strings for unsupported syntax

    Mapping:
    - # Heading → heading block with level
    - Regular paragraphs → paragraph block
    - > Blockquote → quote block
    - ```code blocks``` → code block with language
    - - / * / + list items → list block (ordered=False)
    - 1. ordered items → list block (ordered=True)
    - --- / *** → divider block
    - ![alt](url) → image block (with warning about no media_id linking)
    - HTML tags → warning + skipped
    - Tables → warning + fallback to paragraph
    - Footnotes → warning + skipped
    - Task lists (- [ ]) → warning + fallback to regular list
    """
    lines = markdown_text.split("\n")
    blocks: list[dict] = []
    warnings: list[str] = []
    ordering = 0
    i = 0

    def _make_block(block_type: str, content: dict) -> dict:
        nonlocal ordering
        ordering += 1
        return {
            "block_type": block_type,
            "content": content,
            "ordering": ordering,
            "locale": locale,
        }

    def _flush_paragraph(text_lines: list[str]) -> None:
        """Flush accumulated paragraph lines into a paragraph block."""
        if not text_lines:
            return
        text = "\n".join(text_lines).strip()
        if text:
            blocks.append(_make_block("paragraph", {"text": text}))

    paragraph_buffer: list[str] = []

    while i < len(lines):
        line = lines[i]

        # --- Blank line: flush paragraph buffer ---
        if line.strip() == "":
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            i += 1
            continue

        # --- Fenced code block ---
        code_match = _RE_CODE_FENCE.match(line)
        if code_match:
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            language = code_match.group(1) or ""
            code_lines: list[str] = []
            i += 1
            while i < len(lines):
                if _RE_CODE_FENCE.match(lines[i]) and lines[i].strip().startswith("```"):
                    break
                code_lines.append(lines[i])
                i += 1
            code_text = "\n".join(code_lines)
            blocks.append(
                _make_block("code", {"code": code_text, "language": language})
            )
            i += 1  # skip closing ```
            continue

        # --- Footnote (unsupported) ---
        if _RE_FOOTNOTE.match(line):
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            line_text = line.strip()
            if len(line_text) > 50:
                warnings.append(
                    f"Footnote syntax is not supported and was skipped: "
                    f"'{line_text[:50]}...'"
                )
            else:
                warnings.append(
                    f"Footnote syntax is not supported and was skipped: "
                    f"'{line_text}'"
                )
            i += 1
            continue

        # --- Table detection ---
        if _RE_TABLE_ROW.match(line):
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            table_lines: list[str] = []
            while i < len(lines) and (
                _RE_TABLE_ROW.match(lines[i]) or _RE_TABLE_SEPARATOR.match(lines[i])
            ):
                if not _RE_TABLE_SEPARATOR.match(lines[i]):
                    table_lines.append(lines[i])
                i += 1
            # Fallback: convert table content to paragraph
            table_text = " | ".join(
                cell.strip()
                for row in table_lines
                for cell in row.strip("|").split("|")
            )
            warnings.append(
                "Complex table syntax is not supported. "
                "Content was imported as a plain paragraph."
            )
            if table_text.strip():
                blocks.append(_make_block("paragraph", {"text": table_text.strip()}))
            continue

        # --- HTML detection ---
        if _RE_HTML_TAG.search(line) and not _RE_IMAGE.match(line):
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            line_text = line.strip()
            if len(line_text) > 60:
                warnings.append(
                    f"Inline HTML is not supported and was skipped: "
                    f"'{line_text[:60]}...'"
                )
            else:
                warnings.append(
                    f"Inline HTML is not supported and was skipped: "
                    f"'{line_text}'"
                )
            i += 1
            continue

        # --- Horizontal rule / divider ---
        if _RE_HORIZONTAL_RULE.match(line):
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            blocks.append(_make_block("divider", {"style": "line"}))
            i += 1
            continue

        # --- Heading ---
        heading_match = _RE_HEADING.match(line)
        if heading_match:
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            level = len(heading_match.group(1))
            text = heading_match.group(2).strip()
            blocks.append(_make_block("heading", {"text": text, "level": level}))
            i += 1
            continue

        # --- Image ---
        image_match = _RE_IMAGE.match(line)
        if image_match:
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            alt = image_match.group(1)
            url = image_match.group(2)
            blocks.append(_make_block("image", {"url": url, "alt": alt}))
            warnings.append(
                f"Image imported with URL reference (not linked to media library): "
                f"'{alt or url}'"
            )
            i += 1
            continue

        # --- Blockquote ---
        quote_match = _RE_BLOCKQUOTE.match(line)
        if quote_match:
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            quote_lines: list[str] = []
            while i < len(lines):
                qm = _RE_BLOCKQUOTE.match(lines[i])
                if qm:
                    quote_lines.append(qm.group(1))
                    i += 1
                else:
                    break
            quote_text = "\n".join(quote_lines).strip()
            blocks.append(_make_block("quote", {"text": quote_text}))
            continue

        # --- Task list (unsupported → fallback to regular list + warning) ---
        if _RE_TASK_LIST.match(line):
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            items: list[str] = []
            has_task_items = False
            while i < len(lines):
                task_match = _RE_TASK_LIST.match(lines[i])
                ul_match = _RE_UNORDERED_LIST.match(lines[i])
                if task_match:
                    items.append(task_match.group(1))
                    has_task_items = True
                    i += 1
                elif ul_match:
                    items.append(ul_match.group(1))
                    i += 1
                else:
                    break
            if has_task_items:
                warnings.append(
                    "Task list syntax (- [ ]) is not supported. "
                    "Imported as a regular unordered list."
                )
            blocks.append(
                _make_block("list", {"items": items, "ordered": False})
            )
            continue

        # --- Unordered list ---
        ul_match = _RE_UNORDERED_LIST.match(line)
        if ul_match and not _RE_TASK_LIST.match(line):
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            items = []
            while i < len(lines):
                m = _RE_UNORDERED_LIST.match(lines[i])
                if m and not _RE_TASK_LIST.match(lines[i]):
                    items.append(m.group(1))
                    i += 1
                elif _RE_TASK_LIST.match(lines[i]):
                    # Task list item mixed in - add with warning
                    tm = _RE_TASK_LIST.match(lines[i])
                    items.append(tm.group(1))
                    warnings.append(
                        "Task list syntax (- [ ]) is not supported. "
                        "Imported as a regular unordered list."
                    )
                    i += 1
                else:
                    break
            blocks.append(
                _make_block("list", {"items": items, "ordered": False})
            )
            continue

        # --- Ordered list ---
        ol_match = _RE_ORDERED_LIST.match(line)
        if ol_match:
            _flush_paragraph(paragraph_buffer)
            paragraph_buffer = []
            items = []
            while i < len(lines):
                m = _RE_ORDERED_LIST.match(lines[i])
                if m:
                    items.append(m.group(1))
                    i += 1
                else:
                    break
            blocks.append(
                _make_block("list", {"items": items, "ordered": True})
            )
            continue

        # --- Complex inline link warning ---
        if _RE_INLINE_LINK_COMPLEX.search(line):
            warnings.append(
                "Complex inline link with title attribute detected. "
                "Link kept in paragraph text but title was not preserved."
            )

        # --- Regular paragraph line (buffer it) ---
        paragraph_buffer.append(line)
        i += 1

    # Flush any remaining paragraph buffer
    _flush_paragraph(paragraph_buffer)

    return blocks, warnings


# ---------------------------------------------------------------------------
# Reading Time Calculation (Requirement 6.5)
# ---------------------------------------------------------------------------

import math

# Block types that contain readable text
_READING_TIME_TEXT_BLOCKS = frozenset(
    ["paragraph", "heading", "list", "caption", "quote", "callout"]
)

# Average reading speeds (words per minute)
READING_SPEED_FA = 180  # Persian text is denser
READING_SPEED_EN = 200  # Conservative English estimate


def _extract_text_from_block(block: dict) -> str:
    """Extract readable text from a block's content field.

    Handles different content structures per block type:
    - paragraph: {"text": "..."}
    - heading: {"text": "...", "level": 1-6}
    - list: {"items": ["item1", "item2", ...], "ordered": bool}
    - quote: {"text": "...", "attribution": "..."}
    - callout: {"text": "...", "type": "info|warning|tip"}
    - caption: {"text": "..."}
    """
    content = block.get("content", {})
    if not isinstance(content, dict):
        return ""

    block_type = block.get("block_type", "")
    text_parts: list[str] = []

    if block_type == "list":
        # List blocks have items array
        items = content.get("items", [])
        if isinstance(items, list):
            for item in items:
                if isinstance(item, str):
                    text_parts.append(item)
    else:
        # All other text-bearing types use a "text" key
        text = content.get("text", "")
        if isinstance(text, str):
            text_parts.append(text)

        # Quote blocks may also have attribution text
        if block_type == "quote":
            attribution = content.get("attribution", "")
            if isinstance(attribution, str) and attribution.strip():
                text_parts.append(attribution)

    return " ".join(text_parts)


def _count_words(text: str) -> int:
    """Count words in text by splitting on whitespace.

    Works for both Persian and English as both use spaces between words.
    """
    if not text or not text.strip():
        return 0
    return len(text.split())


def calculate_reading_time(blocks: list[dict], locale: str) -> int:
    """Calculate reading time in minutes for blocks of a given locale.

    Args:
        blocks: List of block dicts, each with 'block_type', 'content',
                and 'locale' keys.
        locale: The locale to filter blocks by ("fa" or "en").

    Returns:
        Reading time in minutes (minimum 1 minute, rounded up).
        Returns 0 if there are no text-bearing blocks for the given locale.
    """
    total_words = 0

    for block in blocks:
        # Filter by locale
        if block.get("locale") != locale:
            continue

        # Only count text-bearing block types
        if block.get("block_type") not in _READING_TIME_TEXT_BLOCKS:
            continue

        text = _extract_text_from_block(block)
        total_words += _count_words(text)

    if total_words == 0:
        return 0

    # Select reading speed based on locale
    words_per_minute = READING_SPEED_FA if locale == "fa" else READING_SPEED_EN

    # Calculate and round up, minimum 1 minute
    reading_time = math.ceil(total_words / words_per_minute)
    return max(1, reading_time)


def update_article_reading_times(article) -> None:
    """Recalculate and save reading times for both locales of an article.

    Fetches all ArticleBlocks for the article, calculates reading time
    for fa and en locales, and updates the article fields.

    Args:
        article: An Article model instance.
    """
    from apps.blog.models import ArticleBlock

    # Fetch all blocks for this article as dicts for efficient processing
    blocks = list(
        ArticleBlock.objects.filter(article=article).values(
            "locale", "block_type", "content"
        )
    )

    article.reading_time_fa = calculate_reading_time(blocks, "fa")
    article.reading_time_en = calculate_reading_time(blocks, "en")
    article.save(update_fields=["reading_time_fa", "reading_time_en", "updated_at"])


# ---------------------------------------------------------------------------
# TOC Generation (Requirement 6.8)
# ---------------------------------------------------------------------------

import unicodedata


def generate_heading_slug(text: str) -> str:
    """Convert heading text to a URL-safe slug for anchor links.

    Handles both Persian and English text:
    - Lowercases ASCII characters
    - Replaces spaces and common separators with hyphens
    - Removes special characters (keeps Unicode letters, digits, hyphens)
    - Collapses multiple hyphens into one
    - Strips leading/trailing hyphens

    Args:
        text: The heading text to slugify.

    Returns:
        A URL-friendly slug string. Returns empty string if input is empty
        or contains no usable characters.
    """
    if not text or not isinstance(text, str):
        return ""

    # Normalize unicode (NFC form for consistent Persian characters)
    slug = unicodedata.normalize("NFC", text.strip())

    # Lowercase (only affects ASCII/Latin characters, Persian stays unchanged)
    slug = slug.lower()

    # Replace common separators with hyphens
    slug = re.sub(r"[\s_/\\]+", "-", slug)

    # Remove characters that are not Unicode letters, digits, or hyphens
    # \w in Python with re.UNICODE matches [a-zA-Z0-9_] + Unicode letters/digits
    # We want to keep: letters (any script), digits, hyphens
    slug = re.sub(r"[^\w\-]", "", slug, flags=re.UNICODE)

    # Remove underscores (we only want hyphens as separators)
    slug = slug.replace("_", "-")

    # Collapse multiple hyphens into one
    slug = re.sub(r"-{2,}", "-", slug)

    # Strip leading/trailing hyphens
    slug = slug.strip("-")

    return slug


def generate_toc(blocks: list[dict], locale: str) -> list[dict]:
    """Generate a table-of-contents structure from article heading blocks.

    Extracts heading blocks for the specified locale and produces a flat list
    of TOC entries with unique anchor IDs.

    Args:
        blocks: List of block dicts, each with 'block_type', 'content',
                'locale', and 'ordering' keys. Content for heading blocks
                should have {"text": "...", "level": 1-6}.
        locale: The locale to filter blocks by ("fa" or "en").

    Returns:
        A flat list of TOC entry dicts:
        [{"id": "slug", "text": "Heading Text", "level": 2}, ...]

        The "id" is a URL-friendly slug of the heading text, with duplicate
        slugs disambiguated by appending -1, -2, etc.

        Returns an empty list if there are no heading blocks for the locale.
    """
    if not blocks or not isinstance(blocks, list):
        return []

    toc_entries: list[dict] = []
    slug_counts: dict[str, int] = {}

    for block in blocks:
        if not isinstance(block, dict):
            continue

        # Filter by locale
        if block.get("locale") != locale:
            continue

        # Only process heading blocks
        if block.get("block_type") != "heading":
            continue

        content = block.get("content", {})
        if not isinstance(content, dict):
            continue

        text = content.get("text", "")
        level = content.get("level", 2)

        if not text or not isinstance(text, str):
            continue

        # Ensure level is a valid integer between 1-6
        if not isinstance(level, int) or level < 1 or level > 6:
            level = 2

        # Generate slug and handle duplicates
        base_slug = generate_heading_slug(text)
        if not base_slug:
            # Fallback for text that produces empty slug
            base_slug = "heading"

        # Track slug occurrences for deduplication
        if base_slug in slug_counts:
            slug_counts[base_slug] += 1
            unique_slug = f"{base_slug}-{slug_counts[base_slug]}"
        else:
            slug_counts[base_slug] = 0
            unique_slug = base_slug

        toc_entries.append({
            "id": unique_slug,
            "text": text.strip(),
            "level": level,
        })

    return toc_entries
