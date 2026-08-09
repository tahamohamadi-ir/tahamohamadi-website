"""Workflow service layer.

Implements the content lifecycle state machine with allowed transitions,
permission checks, scheduling, revision snapshots, and audit logging.

Requirements:
- 8.1: State machine with states: Draft, In_Review, Scheduled, Published, Archived
- 8.2: Enforce allowed transitions
- 8.3: Validate permissions for each transition
- 8.4: Create immutable revision snapshots on publish and on demand
- 8.5: Support revision listing, comparison, and restore (restore creates
       new draft, not in-place overwrite)
- 8.7: Short-lived preview tokens (15min), locale-specific, revocable, not logged/cached
- 8.8: Compute translation status per locale: Missing, Incomplete, Complete, Outdated
- 8.9: When source locale content changes, mark the other locale as Outdated
- 8.10: Audit event on every state transition
"""

from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass
from typing import Any

from django.contrib.contenttypes.models import ContentType
from django.core import signing
from django.db import models, transaction
from django.utils import timezone

from apps.workflow.models import AuditEvent, Revision, ScheduledPublish


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------


@dataclass
class Success:
    """Successful transition result."""

    entity: Any


@dataclass
class TransitionError:
    """Validation error during transition."""

    message: str


@dataclass
class PermissionDenied:
    """User lacks permission for the requested transition."""

    message: str = "Permission denied for this transition."


# Union type for transition results
Result = Success | TransitionError | PermissionDenied


# ---------------------------------------------------------------------------
# State machine definition (Requirement 8.2)
# ---------------------------------------------------------------------------

ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["in_review", "published"],
    "in_review": ["draft", "scheduled", "published"],
    "scheduled": ["draft", "published"],
    "published": ["draft", "archived"],
    "archived": ["draft"],
}

# All valid states
VALID_STATES: set[str] = set(ALLOWED_TRANSITIONS.keys())


# ---------------------------------------------------------------------------
# Permission mapping (Requirement 8.3)
#
# Role-based permissions for transitions:
#   admin   → can perform any transition
#   editor  → can transition to any state except archived
#   reviewer → can only transition between draft and in_review
# ---------------------------------------------------------------------------

# Maps target_status to the set of roles allowed to transition TO that state
_TRANSITION_PERMISSIONS: dict[str, set[str]] = {
    "draft": {"admin", "editor", "reviewer"},
    "in_review": {"admin", "editor", "reviewer"},
    "scheduled": {"admin", "editor"},
    "published": {"admin", "editor"},
    "archived": {"admin"},
}


def _user_has_transition_permission(user: Any, target_status: str) -> bool:
    """Check if a user has permission to transition content to target_status.

    Checks:
    1. Django model-level permission: workflow.transition_to_{target_status}
    2. Superuser always has permission
    3. Role-based check via user groups (admin, editor, reviewer)

    Args:
        user: Django User instance (or any object with has_perm/groups/is_superuser).
        target_status: The target state of the transition.

    Returns:
        True if the user is allowed to perform this transition.
    """
    # Superusers can do anything
    if getattr(user, "is_superuser", False):
        return True

    # Check Django permission (e.g., workflow.transition_to_published)
    perm = f"workflow.transition_to_{target_status}"
    if hasattr(user, "has_perm") and user.has_perm(perm):
        return True

    # Role-based fallback: check user's group names
    allowed_roles = _TRANSITION_PERMISSIONS.get(target_status, set())
    if hasattr(user, "groups"):
        user_groups = set(
            user.groups.values_list("name", flat=True)
            if hasattr(user.groups, "values_list")
            else []
        )
        if user_groups & allowed_roles:
            return True

    return False


# ---------------------------------------------------------------------------
# Serializer registry for DRF-based snapshots (Requirement 8.4)
# ---------------------------------------------------------------------------

_SERIALIZER_MAP: dict[str, str] | None = None


def _get_serializer_map() -> dict[str, str]:
    """Return a mapping of model label -> serializer dotted path.

    Lazily built on first call to avoid circular imports at module load time.
    """
    global _SERIALIZER_MAP  # noqa: PLW0603
    if _SERIALIZER_MAP is None:
        _SERIALIZER_MAP = {
            "cms.page": "apps.cms.serializers.PageSerializer",
            "blog.article": "apps.blog.serializers.ArticleSerializer",
            "portfolio.casestudy": "apps.portfolio.serializers.CaseStudySerializer",
        }
    return _SERIALIZER_MAP


def _resolve_serializer_class(model_label: str):
    """Import and return the serializer class for a given model label."""
    from importlib import import_module

    serializer_map = _get_serializer_map()
    dotted_path = serializer_map.get(model_label)
    if dotted_path is None:
        raise ValueError(
            f"No serializer registered for model '{model_label}'. "
            f"Known models: {list(serializer_map.keys())}"
        )

    module_path, class_name = dotted_path.rsplit(".", 1)
    module = import_module(module_path)
    return getattr(module, class_name)


# ---------------------------------------------------------------------------
# Revision creation (Requirement 8.4)
# ---------------------------------------------------------------------------


def create_revision(entity: Any, label: str = "", user: str = "") -> Revision:
    """Create an immutable revision snapshot of the entity.

    Serializes the entity using its registered DRF serializer into a JSON
    snapshot, then stores it in the Revision model. Revisions are never
    updated once created (immutable).

    Args:
        entity: A model instance (Page, Article, or CaseStudy) to snapshot.
        label: Human-readable label (e.g., "Published at ...").
        user: Username string of who created the revision.

    Returns:
        The created Revision instance.

    Raises:
        ValueError: If no serializer is registered for the entity's model.
    """
    ct = ContentType.objects.get_for_model(entity)
    model_label = f"{ct.app_label}.{ct.model}"

    # Serialize using the DRF serializer for a complete, structured snapshot
    serializer_class = _resolve_serializer_class(model_label)
    serializer = serializer_class(entity)
    snapshot = serializer.data

    return Revision.objects.create(
        content_type=ct,
        object_id=entity.pk,
        snapshot=snapshot,
        label=label,
        created_by=user or getattr(entity, "updated_by", "") or getattr(entity, "created_by", ""),
    )


# ---------------------------------------------------------------------------
# Revision listing (Requirement 8.5)
# ---------------------------------------------------------------------------


def list_revisions(content_type: ContentType, object_id: uuid.UUID) -> models.QuerySet:
    """List all revisions for a given entity.

    Returns revisions ordered by most recent first (default model ordering).

    Args:
        content_type: The ContentType of the entity.
        object_id: The UUID of the entity.

    Returns:
        QuerySet of Revision instances for the entity.
    """
    return Revision.objects.filter(
        content_type=content_type,
        object_id=object_id,
    )


# ---------------------------------------------------------------------------
# Revision comparison (Requirement 8.5)
# ---------------------------------------------------------------------------


def compare_revisions(
    revision_id_a: uuid.UUID,
    revision_id_b: uuid.UUID,
) -> dict[str, Any]:
    """Compare two revision snapshots and return diff data.

    Performs a field-level comparison between two snapshots, categorizing
    fields into added, removed, and changed.

    Args:
        revision_id_a: UUID of the first (older) revision.
        revision_id_b: UUID of the second (newer) revision.

    Returns:
        Dict with keys:
        - "revision_a": UUID of revision A
        - "revision_b": UUID of revision B
        - "added": dict of fields present in B but not A
        - "removed": dict of fields present in A but not B
        - "changed": dict of {field: {"old": val_a, "new": val_b}}
        - "unchanged": list of field names that are identical

    Raises:
        Revision.DoesNotExist: If either revision ID is invalid.
    """
    revision_a = Revision.objects.get(pk=revision_id_a)
    revision_b = Revision.objects.get(pk=revision_id_b)

    snapshot_a = revision_a.snapshot
    snapshot_b = revision_b.snapshot

    all_keys = set(snapshot_a.keys()) | set(snapshot_b.keys())

    added: dict[str, Any] = {}
    removed: dict[str, Any] = {}
    changed: dict[str, dict[str, Any]] = {}
    unchanged: list[str] = []

    for key in sorted(all_keys):
        in_a = key in snapshot_a
        in_b = key in snapshot_b

        if in_a and not in_b:
            removed[key] = snapshot_a[key]
        elif in_b and not in_a:
            added[key] = snapshot_b[key]
        elif snapshot_a[key] != snapshot_b[key]:
            changed[key] = {"old": snapshot_a[key], "new": snapshot_b[key]}
        else:
            unchanged.append(key)

    return {
        "revision_a": revision_id_a,
        "revision_b": revision_id_b,
        "added": added,
        "removed": removed,
        "changed": changed,
        "unchanged": unchanged,
    }


# ---------------------------------------------------------------------------
# Revision restore (Requirement 8.5)
# ---------------------------------------------------------------------------


def restore_revision(revision_id: uuid.UUID, user: Any) -> models.Model:
    """Restore a revision by creating a new draft entity from its snapshot.

    This does NOT overwrite the original entity. Instead, it creates a brand
    new entity (same model type) populated with the snapshot data, set to
    draft status with version=1. The new entity gets fresh UUIDs for itself
    and any nested objects (blocks, sections).

    Slug fields are de-duplicated by appending a short suffix to avoid
    unique constraint violations.

    Args:
        revision_id: UUID of the Revision to restore from.
        user: The user performing the restore (sets created_by/updated_by).

    Returns:
        The newly created draft entity.

    Raises:
        Revision.DoesNotExist: If the revision ID is invalid.
        ValueError: If the model type is not supported for restoration.
    """
    revision = Revision.objects.get(pk=revision_id)
    content_type = revision.content_type
    model_label = f"{content_type.app_label}.{content_type.model}"
    snapshot = revision.snapshot

    username = _get_username(user)

    if model_label == "cms.page":
        return _restore_page(content_type.model_class(), snapshot, username)
    elif model_label == "blog.article":
        return _restore_article(content_type.model_class(), snapshot, username)
    elif model_label == "portfolio.casestudy":
        return _restore_case_study(content_type.model_class(), snapshot, username)
    else:
        raise ValueError(f"Restore not supported for model '{model_label}'.")


def _make_unique_slug(model_class, field_name: str, base_slug: str) -> str:
    """Generate a unique slug by appending a suffix if necessary."""
    slug = f"{base_slug}-restored"
    suffix = 1
    while model_class.objects.filter(**{field_name: slug}).exists():
        slug = f"{base_slug}-restored-{suffix}"
        suffix += 1
    return slug


@transaction.atomic
def _restore_page(model_class, snapshot: dict, username: str):
    """Create a new Page draft from a revision snapshot."""
    from apps.cms.models import Block, Section
    from apps.cms.services import validate_page_composition

    composition_errors = validate_page_composition(snapshot)
    if composition_errors:
        raise ValueError(
            "Page revision contains invalid composition: "
            + "; ".join(composition_errors)
        )

    slug_fa = _make_unique_slug(model_class, "slug_fa", snapshot.get("slug_fa", "page"))
    slug_en = _make_unique_slug(model_class, "slug_en", snapshot.get("slug_en", "page"))

    page = model_class.objects.create(
        slug_fa=slug_fa,
        slug_en=slug_en,
        title_fa=snapshot.get("title_fa", ""),
        title_en=snapshot.get("title_en", ""),
        page_type=snapshot.get("page_type", "custom"),
        status="draft",
        version=1,
        created_by=username,
        updated_by=username,
    )

    # Recreate sections and blocks from snapshot
    for section_data in snapshot.get("sections", []):
        section = Section.objects.create(
            page=page,
            ordering=section_data.get("ordering", 0),
            enabled=section_data.get("enabled", True),
            layout=section_data.get("layout", "default"),
        )
        for block_data in section_data.get("blocks", []):
            Block.objects.create(
                section=section,
                block_type=block_data.get("block_type", ""),
                settings=block_data.get("settings", {}),
                ordering=block_data.get("ordering", 0),
            )

    return page


@transaction.atomic
def _restore_article(model_class, snapshot: dict, username: str):
    """Create a new Article draft from a revision snapshot."""
    from apps.blog.models import ArticleBlock, Topic

    slug_fa = _make_unique_slug(model_class, "slug_fa", snapshot.get("slug_fa", "article"))
    slug_en = _make_unique_slug(model_class, "slug_en", snapshot.get("slug_en", "article"))

    article = model_class.objects.create(
        slug_fa=slug_fa,
        slug_en=slug_en,
        title_fa=snapshot.get("title_fa", ""),
        title_en=snapshot.get("title_en", ""),
        excerpt_fa=snapshot.get("excerpt_fa", ""),
        excerpt_en=snapshot.get("excerpt_en", ""),
        status="draft",
        version=1,
        reading_time_fa=snapshot.get("reading_time_fa", 0),
        reading_time_en=snapshot.get("reading_time_en", 0),
        created_by=username,
        updated_by=username,
    )

    # Restore featured_image if present (by UUID reference)
    featured_image_data = snapshot.get("featured_image")
    if featured_image_data and isinstance(featured_image_data, dict):
        image_id = featured_image_data.get("id")
        if image_id:
            from apps.media.models import MediaAsset

            if MediaAsset.objects.filter(pk=image_id).exists():
                article.featured_image_id = image_id
                article.save(update_fields=["featured_image"])

    # Restore topics M2M (by UUID reference)
    topics_data = snapshot.get("topics", [])
    topic_ids = []
    for topic_item in topics_data:
        if isinstance(topic_item, dict):
            tid = topic_item.get("id")
            if tid:
                topic_ids.append(tid)
        elif isinstance(topic_item, str):
            topic_ids.append(topic_item)

    if topic_ids:
        existing_topics = Topic.objects.filter(pk__in=topic_ids)
        article.topics.set(existing_topics)

    # Recreate blocks
    for block_data in snapshot.get("blocks", []):
        ArticleBlock.objects.create(
            article=article,
            locale=block_data.get("locale", "en"),
            block_type=block_data.get("block_type", ""),
            content=block_data.get("content", {}),
            ordering=block_data.get("ordering", 0),
        )

    return article


@transaction.atomic
def _restore_case_study(model_class, snapshot: dict, username: str):
    """Create a new CaseStudy draft from a revision snapshot."""
    from apps.portfolio.models import CaseStudyBlock

    slug_fa = _make_unique_slug(model_class, "slug_fa", snapshot.get("slug_fa", "case-study"))
    slug_en = _make_unique_slug(model_class, "slug_en", snapshot.get("slug_en", "case-study"))

    case_study = model_class.objects.create(
        slug_fa=slug_fa,
        slug_en=slug_en,
        title_fa=snapshot.get("title_fa", ""),
        title_en=snapshot.get("title_en", ""),
        role_fa=snapshot.get("role_fa", ""),
        role_en=snapshot.get("role_en", ""),
        statement_fa=snapshot.get("statement_fa", ""),
        statement_en=snapshot.get("statement_en", ""),
        problem_fa=snapshot.get("problem_fa", ""),
        problem_en=snapshot.get("problem_en", ""),
        client_fa=snapshot.get("client_fa", ""),
        client_en=snapshot.get("client_en", ""),
        date_start=snapshot.get("date_start"),
        date_end=snapshot.get("date_end"),
        technologies=snapshot.get("technologies", []),
        outcome_fa=snapshot.get("outcome_fa", ""),
        outcome_en=snapshot.get("outcome_en", ""),
        featured=False,
        status="draft",
        version=1,
        created_by=username,
        updated_by=username,
    )

    # Restore gallery M2M (by UUID reference)
    gallery_data = snapshot.get("gallery", [])
    gallery_ids = []
    for item in gallery_data:
        if isinstance(item, dict):
            gid = item.get("id")
            if gid:
                gallery_ids.append(gid)
        elif isinstance(item, str):
            gallery_ids.append(item)

    if gallery_ids:
        from apps.media.models import MediaAsset

        existing_media = MediaAsset.objects.filter(pk__in=gallery_ids)
        case_study.gallery.set(existing_media)

    # Recreate narrative blocks
    narrative_blocks = snapshot.get("narrative_blocks", [])
    for block_data in narrative_blocks:
        CaseStudyBlock.objects.create(
            case_study=case_study,
            locale=block_data.get("locale", "en"),
            block_type=block_data.get("block_type", ""),
            content=block_data.get("content", {}),
            ordering=block_data.get("ordering", 0),
        )

    return case_study


# ---------------------------------------------------------------------------
# Audit event creation helper (Requirement 8.10)
# ---------------------------------------------------------------------------


def create_audit_event(
    entity: Any,
    from_status: str,
    to_status: str,
    user: Any = None,
    reason: str = "",
) -> AuditEvent:
    """Record an audit event for a state transition.

    Args:
        entity: The content entity that transitioned.
        from_status: Previous status.
        to_status: New status.
        user: User who performed the transition (Django User instance or None
            for system-initiated transitions).
        reason: Optional reason for the transition.

    Returns:
        The created AuditEvent instance.
    """
    ct = ContentType.objects.get_for_model(entity)

    # The AuditEvent.user field is a ForeignKey — pass the user object
    # directly (or None for system actions).
    user_obj = None
    if user is not None and hasattr(user, "pk"):
        user_obj = user

    return AuditEvent.objects.create(
        content_type=ct,
        object_id=entity.pk,
        from_status=from_status,
        to_status=to_status,
        user=user_obj,
        reason=reason,
    )


def _get_username(user: Any) -> str:
    """Extract a username string from a user object."""
    if isinstance(user, str):
        return user
    if hasattr(user, "get_username"):
        return user.get_username()
    if hasattr(user, "username"):
        return user.username
    if hasattr(user, "email"):
        return user.email
    return str(user)


# ---------------------------------------------------------------------------
# Main state machine function (Requirements 8.1, 8.2, 8.3, 8.10)
# ---------------------------------------------------------------------------


@transaction.atomic
def transition_status(
    entity: Any,
    target_status: str,
    user: Any,
    *,
    scheduled_at=None,
    reason: str = "",
) -> Result:
    """Validate and execute a workflow state transition.

    Algorithm:
    1. Validate the transition is allowed by the state machine
    2. Check user permissions for the transition (role-based)
    3. For "scheduled" target: validate scheduled_at is in the future
    4. For "published" target: set published_at, create revision snapshot
    5. Create audit event on every successful transition
    6. Return Result (Success or validation/permission error)

    Args:
        entity: A model instance with a `status` field (e.g., Page, Article).
        target_status: The desired new status.
        user: The user performing the transition.
        scheduled_at: Required when target_status is "scheduled". Must be
            a timezone-aware datetime in the future.
        reason: Optional reason for the transition (stored in audit log).

    Returns:
        Success with the updated entity, TransitionError for invalid
        transitions, or PermissionDenied for unauthorized attempts.

    Preconditions:
        - entity.status is a valid lifecycle state
        - entity has a `status` field and a `pk`

    Postconditions:
        - entity.status == target_status (on success)
        - Audit event recorded (on success)
        - If "published": published_at set, revision snapshot created
        - If "scheduled": ScheduledPublish job created
    """
    current_status = getattr(entity, "status", None)

    # Validate current status is known
    if current_status not in VALID_STATES:
        return TransitionError(
            f"Current status '{current_status}' is not a valid workflow state. "
            f"Valid states: {sorted(VALID_STATES)}"
        )

    # Validate target status is known
    if target_status not in VALID_STATES:
        return TransitionError(
            f"Target status '{target_status}' is not a valid workflow state. "
            f"Valid states: {sorted(VALID_STATES)}"
        )

    # Step 1: Check if transition is allowed
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if target_status not in allowed:
        return TransitionError(
            f"Cannot transition from '{current_status}' to '{target_status}'. "
            f"Allowed transitions from '{current_status}': {allowed}"
        )

    # Step 2: Check user permissions
    if not _user_has_transition_permission(user, target_status):
        return PermissionDenied(
            f"User '{_get_username(user)}' does not have permission to "
            f"transition content to '{target_status}'."
        )

    # Step 3: For "scheduled" target, validate scheduled_at
    if target_status == "scheduled":
        if scheduled_at is None:
            return TransitionError(
                "scheduled_at is required when transitioning to 'scheduled'."
            )
        if not hasattr(scheduled_at, "isoformat"):
            return TransitionError(
                "scheduled_at must be a datetime object."
            )
        if scheduled_at <= timezone.now():
            return TransitionError(
                "scheduled_at must be in the future."
            )

        # Create the scheduled publish job
        ct = ContentType.objects.get_for_model(entity)
        ScheduledPublish.objects.create(
            content_type=ct,
            object_id=entity.pk,
            scheduled_at=scheduled_at,
        )

    # Step 4: For "published" target, set published_at and create revision
    if target_status == "published":
        # T7.1: Minimal SEO Quality Gate
        title_fa = getattr(entity, "title_fa", "")
        title_en = getattr(entity, "title_en", "")
        if not title_fa and not title_en:
             return TransitionError("SEO Quality Gate Failed: Published content must have at least one title.")

        model_label = f"{entity._meta.app_label}.{entity._meta.model_name}"
        if model_label == "blog.article":
            excerpt_fa = getattr(entity, "excerpt_fa", "")
            excerpt_en = getattr(entity, "excerpt_en", "")
            if not excerpt_fa and not excerpt_en:
                return TransitionError("SEO Quality Gate Failed: Article must have at least one excerpt.")
            if not getattr(entity, "featured_image_id", None) and not getattr(entity, "featured_image", None):
                return TransitionError("SEO Quality Gate Failed: Article must have a featured image.")

        entity.published_at = timezone.now()
        username = _get_username(user)
        create_revision(
            entity,
            label=f"Published at {entity.published_at.isoformat()}",
            user=username,
        )

    # Step 5: Apply the transition
    entity.status = target_status
    entity.save()

    # Step 6: Create audit event
    create_audit_event(
        entity,
        from_status=current_status,
        to_status=target_status,
        user=user,
        reason=reason,
    )

    return Success(entity=entity)


# ---------------------------------------------------------------------------
# Translation status computation (Requirements 8.8, 8.9)
# ---------------------------------------------------------------------------

# Supported locales
SUPPORTED_LOCALES: tuple[str, ...] = ("fa", "en")

# Maps model app_label.model to the locale-specific field suffixes
# that are considered "translatable content" for status computation.
_LOCALE_FIELDS_MAP: dict[str, list[str]] = {
    "cms.page": ["title"],
    "blog.article": ["title", "excerpt"],
    "portfolio.casestudy": ["title", "role", "outcome"],
}


def _get_model_label(entity) -> str:
    """Return the 'app_label.model' identifier for an entity."""
    meta = entity._meta  # noqa: SLF001
    return f"{meta.app_label}.{meta.model_name}"


def _get_locale_fields(entity, locale: str) -> dict[str, str]:
    """Get all locale-specific field names and values for a given locale.

    Returns a dict of {field_name: field_value} for the target locale.
    For example, for an Article with locale="fa", returns:
    {"title_fa": "...", "slug_fa": "...", "excerpt_fa": "..."}

    If the entity's model is not in the known map, falls back to
    auto-discovery of fields ending with _{locale}.
    """
    model_label = _get_model_label(entity)
    known_bases = _LOCALE_FIELDS_MAP.get(model_label)

    if known_bases is not None:
        fields = {}
        for base in known_bases:
            field_name = f"{base}_{locale}"
            fields[field_name] = getattr(entity, field_name, "")
        return fields

    # Fallback: auto-discover fields ending with _{locale}
    suffix = f"_{locale}"
    fields = {}
    for field in entity._meta.get_fields():  # noqa: SLF001
        if hasattr(field, "attname") and field.attname.endswith(suffix):
            fields[field.attname] = getattr(entity, field.attname, "")
    return fields


def _get_locale_last_edit(entity, locale: str):
    """Get the last edit timestamp for a specific locale.

    Reads from entity.locale_updated_at JSON field.
    Returns a datetime or None if no timestamp is recorded.
    """
    from django.utils.dateparse import parse_datetime

    locale_timestamps = getattr(entity, "locale_updated_at", None)
    if not locale_timestamps or not isinstance(locale_timestamps, dict):
        return None

    timestamp_str = locale_timestamps.get(locale)
    if not timestamp_str:
        return None

    # Handle both string timestamps and already-parsed datetimes
    if hasattr(timestamp_str, "isoformat"):
        return timestamp_str

    return parse_datetime(str(timestamp_str))


def _is_field_empty(value) -> bool:
    """Determine if a field value is considered empty for translation purposes."""
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ""
    return False


def compute_translation_status(entity, target_locale: str) -> str:
    """Compute the translation freshness status for a given locale.

    Algorithm (from design.md):
    1. Get all locale-specific fields for the target locale
    2. If ALL target locale fields are empty → "missing"
    3. If SOME target locale fields are empty → "incomplete"
    4. Check if source locale was updated after target locale → "outdated"
    5. Otherwise → "complete"

    Args:
        entity: A model instance with locale-specific fields (Page, Article, CaseStudy).
        target_locale: The locale to check status for ("fa" or "en").

    Returns:
        One of: "missing", "incomplete", "complete", "outdated"

    Preconditions:
        - entity has fields suffixed with locale (e.g., title_fa, title_en)
        - target_locale is "fa" or "en"

    Postconditions:
        - Returns "missing" if all target locale fields are empty
        - Returns "incomplete" if some target locale fields are empty
        - Returns "outdated" if source locale was updated after target locale
        - Returns "complete" otherwise
    """
    if target_locale not in SUPPORTED_LOCALES:
        raise ValueError(
            f"Unsupported locale '{target_locale}'. "
            f"Supported: {SUPPORTED_LOCALES}"
        )

    # Determine the source locale (opposite of target)
    source_locale = "en" if target_locale == "fa" else "fa"

    # Step 1: Get target locale field values
    target_fields = _get_locale_fields(entity, target_locale)

    if not target_fields:
        # No translatable fields found for this entity type
        return "complete"

    # Step 2: Check if ALL target fields are empty → "missing"
    field_values = list(target_fields.values())
    all_empty = all(_is_field_empty(v) for v in field_values)
    if all_empty:
        return "missing"

    # Step 3: Check if SOME target fields are empty → "incomplete"
    some_empty = any(_is_field_empty(v) for v in field_values)
    if some_empty:
        return "incomplete"

    # Step 4: Check if source locale was updated after target locale → "outdated"
    source_last_edit = _get_locale_last_edit(entity, source_locale)
    target_last_edit = _get_locale_last_edit(entity, target_locale)

    if source_last_edit and target_last_edit and source_last_edit > target_last_edit:
        return "outdated"

    # Step 5: All fields filled and not outdated → "complete"
    return "complete"


def get_translation_statuses(entity) -> dict[str, str]:
    """Compute translation status for all supported locales.

    Args:
        entity: A model instance with locale-specific fields.

    Returns:
        Dict mapping locale to status, e.g.:
        {"fa": "complete", "en": "incomplete"}
    """
    return {
        locale: compute_translation_status(entity, locale)
        for locale in SUPPORTED_LOCALES
    }


# ---------------------------------------------------------------------------
# Preview token generation (Requirement 8.7)
#
# Short-lived (15 minutes), locale-specific, revocable tokens for previewing
# unpublished content. Uses Django's signing framework for stateless tokens
# with a small in-memory revocation set for revocability.
#
# Tokens are NOT logged or cached per requirement.
# ---------------------------------------------------------------------------

# Preview token expiry in seconds (15 minutes)
_PREVIEW_TOKEN_MAX_AGE: int = 15 * 60

# Salt used to namespace preview tokens in Django's signing framework
_PREVIEW_TOKEN_SALT: str = "workflow.preview_token"

# In-process revocation cache for fast validation without DB hit.
# Acts as a first-level check; the database PreviewToken.revoked field
# is the authoritative source of truth for revocation.
_revoked_tokens: set[str] = set()


@dataclass
class PreviewTokenData:
    """Result returned by validate_preview_token on success."""

    entity: Any
    locale: str


def generate_preview_token(entity, locale: str, user: Any = None) -> str:
    """Generate a short-lived preview token for unpublished content.

    Creates a cryptographically signed token using Django's signing framework.
    The token embeds the entity type (content_type), entity ID (object_id),
    and locale, and expires after 15 minutes.

    The token is stored in the database (PreviewToken model) for durable
    revocation tracking. Preview responses are NOT cached per requirement 8.7
    (Cache-Control: no-store is enforced at the view layer).

    Args:
        entity: A model instance (Page, Article, CaseStudy) to preview.
        locale: The locale for the preview ("fa" or "en").
        user: The user requesting the preview (informational, not stored
            in token — kept for API consistency).

    Returns:
        A URL-safe signed token string.

    Raises:
        ValueError: If locale is not "fa" or "en".

    Preconditions:
        - entity has a `pk` attribute (UUID)
        - locale is "fa" or "en"

    Postconditions:
        - Token is valid for 15 minutes
        - Token is locale-specific (bound to "fa" or "en")
        - Token is tied to a specific content entity (via content_type + object_id)
        - Token record stored in database with expiry and revoked flag
        - Preview responses include X-Robots-Tag: noindex, Cache-Control: no-store
    """
    from apps.workflow.models import PreviewToken
    from datetime import timedelta

    if locale not in SUPPORTED_LOCALES:
        raise ValueError(
            f"Unsupported locale '{locale}'. Supported: {SUPPORTED_LOCALES}"
        )

    ct = ContentType.objects.get_for_model(entity)

    payload = {
        "ct": ct.pk,
        "oid": str(entity.pk),
        "loc": locale,
        # TimestampSigner timestamps are second-granular.  A nonce keeps
        # independently issued tokens distinct within the same second.
        "nonce": secrets.token_urlsafe(16),
    }

    token = signing.dumps(payload, salt=_PREVIEW_TOKEN_SALT)

    # Store the token in the database for durable revocation tracking
    expires_at = timezone.now() + timedelta(seconds=_PREVIEW_TOKEN_MAX_AGE)
    PreviewToken.objects.create(
        token=token,
        content_type=ct,
        object_id=entity.pk,
        locale=locale,
        expires_at=expires_at,
    )

    return token


def validate_preview_token(token: str) -> PreviewTokenData | None:
    """Validate a preview token and return the associated entity and locale.

    Checks that:
    1. The token has not been revoked (in-memory cache + DB check)
    2. The token is authentic (valid cryptographic signature)
    3. The token has not expired (max 15 minutes)
    4. The referenced entity still exists

    Args:
        token: The signed token string to validate.

    Returns:
        PreviewTokenData with the entity and locale if valid, None if
        expired, revoked, or invalid.
    """
    from apps.workflow.models import PreviewToken

    # Check in-memory revocation cache first (fast path)
    if token in _revoked_tokens:
        return None

    # The persisted record is authoritative for revocation and expiry.  This
    # also rejects signatures for tokens that were never issued by this app.
    token_record = PreviewToken.objects.filter(token=token).only(
        "expires_at", "revoked"
    ).first()
    if (
        token_record is None
        or token_record.revoked
        or token_record.expires_at <= timezone.now()
    ):
        # Populate in-memory cache for subsequent checks
        _revoked_tokens.add(token)
        return None

    try:
        payload = signing.loads(
            token,
            salt=_PREVIEW_TOKEN_SALT,
            max_age=_PREVIEW_TOKEN_MAX_AGE,
        )
    except (signing.BadSignature, signing.SignatureExpired):
        return None

    # Extract payload data
    ct_id = payload.get("ct")
    object_id = payload.get("oid")
    locale = payload.get("loc")

    if not ct_id or not object_id or not locale:
        return None

    # Resolve the entity
    try:
        ct = ContentType.objects.get(pk=ct_id)
        model_class = ct.model_class()
        if model_class is None:
            return None
        entity = model_class.objects.get(pk=object_id)
    except (ContentType.DoesNotExist, model_class.DoesNotExist):
        return None

    return PreviewTokenData(entity=entity, locale=locale)


def revoke_preview_token(token: str) -> None:
    """Revoke a previously issued preview token.

    Marks the token as revoked both in the in-memory cache and in the
    database (if a record exists). The token can no longer be used even
    if it hasn't expired yet.

    Args:
        token: The token string to revoke.

    Postconditions:
        - The token will no longer pass validation.
        - This operation is idempotent (revoking an already-revoked token is a no-op).
        - Database record updated with revoked=True if it exists.
    """
    from apps.workflow.models import PreviewToken

    # Always add to in-memory cache for fast rejection
    _revoked_tokens.add(token)

    # Update database record if it exists
    PreviewToken.objects.filter(token=token, revoked=False).update(revoked=True)


def revoke_preview_tokens_for_entity(entity) -> int:
    """Revoke all active preview tokens for a specific entity.

    Useful when content is published or deleted — all outstanding
    preview tokens for that entity should be invalidated.

    Args:
        entity: The content entity whose tokens should be revoked.

    Returns:
        Number of tokens revoked.
    """
    from apps.workflow.models import PreviewToken

    ct = ContentType.objects.get_for_model(entity)
    tokens_qs = PreviewToken.objects.filter(
        content_type=ct,
        object_id=entity.pk,
        revoked=False,
    )

    # Add to in-memory cache
    for token_record in tokens_qs:
        _revoked_tokens.add(token_record.token)

    # Bulk update in database
    count = tokens_qs.update(revoked=True)
    return count


def cleanup_expired_preview_tokens() -> int:
    """Delete expired preview tokens from the database.

    Tokens that have passed their expiry time are no longer useful
    (they would fail cryptographic validation anyway). This function
    removes them to keep the database clean.

    Returns:
        Number of deleted records.
    """
    from apps.workflow.models import PreviewToken

    expired_qs = PreviewToken.objects.filter(expires_at__lt=timezone.now())
    count = expired_qs.count()
    expired_qs.delete()
    return count
