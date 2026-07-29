"""Preview token public API.

Provides generate, validate, and revoke functions for short-lived preview
tokens. This module re-exports from the services layer and adds a
backward-compatible validate signature that accepts entity + locale
for direct matching.

Requirement 8.7: Short-lived preview tokens (15min), locale-specific,
revocable, not logged/cached.
"""

from __future__ import annotations

from typing import Any

from django.contrib.contenttypes.models import ContentType
from django.core import signing
from django.utils import timezone

from apps.workflow.services import (
    PreviewTokenData,
    _PREVIEW_TOKEN_MAX_AGE,
    _PREVIEW_TOKEN_SALT,
    _revoked_tokens,
    generate_preview_token,
    revoke_preview_token,
    revoke_preview_tokens_for_entity,
    cleanup_expired_preview_tokens,
)

# Re-export generate and revoke directly
__all__ = [
    "generate_preview_token",
    "validate_preview_token",
    "revoke_preview_token",
    "revoke_preview_tokens_for_entity",
    "cleanup_expired_preview_tokens",
    "PreviewTokenData",
]


def validate_preview_token(
    token: str,
    entity: Any = None,
    locale: str | None = None,
) -> bool | PreviewTokenData | None:
    """Validate a preview token.

    Supports two calling conventions:

    1. validate_preview_token(token, entity, locale) -> bool
       Checks the token is valid AND matches the given entity/locale.

    2. validate_preview_token(token) -> PreviewTokenData | None
       Decodes the token and returns the entity + locale if valid.

    Args:
        token: The signed token string to validate.
        entity: If provided, verify the token matches this entity.
        locale: If provided with entity, verify the token matches this locale.

    Returns:
        - If entity and locale provided: True if valid, False otherwise.
        - If no entity/locale: PreviewTokenData or None.
    """
    from apps.workflow.models import PreviewToken

    # Check in-memory revocation cache first (fast path)
    if token in _revoked_tokens:
        if entity is not None and locale is not None:
            return False
        return None

    # The persisted record is authoritative for revocation and expiry. This
    # rejects a validly signed token that has been deleted or never issued.
    token_record = PreviewToken.objects.filter(token=token).only(
        "expires_at", "revoked"
    ).first()
    if (
        token_record is None
        or token_record.revoked
        or token_record.expires_at <= timezone.now()
    ):
        _revoked_tokens.add(token)
        if entity is not None and locale is not None:
            return False
        return None

    try:
        payload = signing.loads(
            token,
            salt=_PREVIEW_TOKEN_SALT,
            max_age=_PREVIEW_TOKEN_MAX_AGE,
        )
    except (signing.BadSignature, signing.SignatureExpired):
        if entity is not None and locale is not None:
            return False
        return None

    # Extract payload data
    ct_id = payload.get("ct")
    object_id = payload.get("oid")
    token_locale = payload.get("loc")

    if not ct_id or not object_id or not token_locale:
        if entity is not None and locale is not None:
            return False
        return None

    # If entity and locale are provided, do a direct match (backward-compatible)
    if entity is not None and locale is not None:
        ct = ContentType.objects.get_for_model(entity)
        if ct_id != ct.pk:
            return False
        if object_id != str(entity.pk):
            return False
        if token_locale != locale:
            return False
        return True

    # Otherwise, resolve the entity from the token (new API)
    try:
        ct = ContentType.objects.get(pk=ct_id)
        model_class = ct.model_class()
        if model_class is None:
            return None
        resolved_entity = model_class.objects.get(pk=object_id)
    except Exception:
        return None

    return PreviewTokenData(entity=resolved_entity, locale=token_locale)
