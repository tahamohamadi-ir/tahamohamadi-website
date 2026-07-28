"""
RFC 7807 Problem Details for the whole API.

Every error response — DRF or plain Django — uses the same body shape:

    {
      "type":     "https://tahamohamadi.ir/problems/validation-error",
      "title":    "Validation error",
      "status":   422,
      "detail":   "One or more fields are invalid.",
      "instance": "/api/admin/pages/1",
      "errors":   {"slug_fa": ["This field is required."]}   # optional
    }

`errors` is only present for field-level validation failures. The response
content type is `application/problem+json`.
"""

from __future__ import annotations

from typing import Any

from django.conf import settings
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404, JsonResponse
from rest_framework import status as http_status
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

PROBLEM_CONTENT_TYPE = "application/problem+json"

#: Machine-readable problem slug + human title per HTTP status code.
PROBLEM_TYPES: dict[int, tuple[str, str]] = {
    400: ("bad-request", "Bad request"),
    401: ("unauthenticated", "Authentication required"),
    403: ("forbidden", "Forbidden"),
    404: ("not-found", "Resource not found"),
    405: ("method-not-allowed", "Method not allowed"),
    406: ("not-acceptable", "Not acceptable"),
    409: ("conflict", "Version conflict"),
    413: ("payload-too-large", "Payload too large"),
    415: ("unsupported-media-type", "Unsupported media type"),
    422: ("validation-error", "Validation error"),
    429: ("rate-limited", "Too many requests"),
    500: ("server-error", "Internal server error"),
    503: ("service-unavailable", "Service unavailable"),
}


class ConflictError(APIException):
    """Optimistic-locking conflict (mapped to HTTP 409)."""

    status_code = http_status.HTTP_409_CONFLICT
    default_detail = "The resource was modified by someone else."
    default_code = "conflict"


def problem_type_uri(status_code: int) -> str:
    slug, _ = PROBLEM_TYPES.get(status_code, ("error", "Error"))
    return f"{settings.PROBLEM_TYPE_BASE_URI.rstrip('/')}/{slug}"


def problem_title(status_code: int) -> str:
    _, title = PROBLEM_TYPES.get(status_code, ("error", "Error"))
    return title


def build_problem(
    status_code: int,
    detail: str,
    *,
    instance: str | None = None,
    errors: Any = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Assemble a Problem Details body. Keys with no value are omitted."""
    problem: dict[str, Any] = {
        "type": problem_type_uri(status_code),
        "title": problem_title(status_code),
        "status": status_code,
        "detail": detail,
    }
    if instance:
        problem["instance"] = instance
    if errors:
        problem["errors"] = errors
    if extra:
        problem.update(extra)
    return problem


def _flatten_detail(detail: Any) -> str:
    """Reduce a DRF detail (str / list / dict) to a single human-readable string."""
    if isinstance(detail, dict):
        first = next(iter(detail.values()), "")
        return _flatten_detail(first)
    if isinstance(detail, (list, tuple)):
        return _flatten_detail(detail[0]) if detail else ""
    return str(detail)


def problem_detail_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """DRF `EXCEPTION_HANDLER`: rewrite handled exceptions as Problem Details."""
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(detail=getattr(exc, "message_dict", None) or list(exc.messages))
    elif isinstance(exc, DjangoPermissionDenied):
        exc = APIException(detail="You do not have permission to perform this action.")
        exc.status_code = http_status.HTTP_403_FORBIDDEN
    elif isinstance(exc, Http404):
        detail = str(exc) if str(exc) else "The requested resource was not found."
        exc = NotFound(detail=detail)

    response = drf_exception_handler(exc, context)
    if response is None:
        # Unhandled exception: let Django's 500 handling take over.
        return None

    request = context.get("request")
    instance = getattr(request, "path", None)

    if isinstance(exc, ValidationError):
        status_code = http_status.HTTP_422_UNPROCESSABLE_ENTITY
        errors = response.data
        detail = "One or more fields are invalid."
        if isinstance(errors, list):
            errors = {"non_field_errors": errors}
    else:
        status_code = response.status_code
        errors = None
        payload = response.data
        if isinstance(payload, dict) and "detail" in payload:
            payload = payload["detail"]
        detail = _flatten_detail(payload) or problem_title(status_code)

    extra = {}
    if isinstance(exc, ConflictError) and isinstance(getattr(exc, "extra", None), dict):
        extra = exc.extra

    return Response(
        build_problem(
            status_code,
            detail,
            instance=instance,
            errors=errors,
            extra=extra or None,
        ),
        status=status_code,
        headers={"Content-Language": getattr(request, "LANGUAGE_CODE", None) or "en"},
        content_type=PROBLEM_CONTENT_TYPE,
    )


def problem_json_response(request, status_code: int, detail: str) -> JsonResponse:
    """Problem Details response for plain-Django error handlers."""
    return JsonResponse(
        build_problem(status_code, detail, instance=getattr(request, "path", None)),
        status=status_code,
        content_type=PROBLEM_CONTENT_TYPE,
    )


__all__ = [
    "ConflictError",
    "PROBLEM_CONTENT_TYPE",
    "PROBLEM_TYPES",
    "build_problem",
    "problem_detail_exception_handler",
    "problem_json_response",
    "problem_title",
    "problem_type_uri",
]
