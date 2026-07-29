"""Audit logging middleware for all admin mutations.

Intercepts state-mutating requests (POST, PUT, PATCH, DELETE) to admin API
endpoints and creates AuditEvent records capturing user, timestamp, action,
entity, and endpoint.

Requirements: 3.6, 12.6
"""

from __future__ import annotations

import logging
import uuid

from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)

# HTTP methods that mutate state
MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Map HTTP methods to human-readable action names
METHOD_ACTION_MAP = {
    "POST": "create",
    "PUT": "update",
    "PATCH": "update",
    "DELETE": "delete",
}

# Admin API prefix to intercept
ADMIN_API_PREFIX = "/api/admin/"

# Endpoints to exclude from audit logging (health checks, read-only GETs that
# happen to be POST for CSRF, etc.)
EXCLUDED_ENDPOINTS = {
    "/api/admin/health/",
}


class AuditLoggingMiddleware:
    """Django middleware that logs all state-mutating admin API requests.

    For each POST/PUT/PATCH/DELETE request to /api/admin/*, creates an
    AuditEvent record with:
    - user: the authenticated user
    - timestamp: when the request was processed
    - action: create/update/delete (derived from HTTP method)
    - entity: content_type + object_id (extracted from URL or response)
    - endpoint: the request path

    The middleware runs after the response is generated so it can capture
    the response status (only logging successful mutations, 2xx).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only log mutating requests to admin endpoints
        if not self._should_log(request, response):
            return response

        try:
            self._create_audit_event(request, response)
        except Exception:
            # Never let audit logging break the request flow
            logger.exception("Failed to create audit event for %s %s", request.method, request.path)

        return response

    def _should_log(self, request, response) -> bool:
        """Determine if this request should be audit-logged."""
        # Only mutating methods
        if request.method not in MUTATING_METHODS:
            return False

        # Only admin API endpoints
        if not request.path.startswith(ADMIN_API_PREFIX):
            return False

        # Skip excluded endpoints
        if request.path in EXCLUDED_ENDPOINTS:
            return False

        # Only log successful responses (2xx)
        if not (200 <= response.status_code < 300):
            return False

        # Must have an authenticated user
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return False

        return True

    def _create_audit_event(self, request, response) -> None:
        """Create an AuditEvent record for the mutating admin request."""
        from apps.workflow.models import AuditEvent

        action = METHOD_ACTION_MAP.get(request.method, request.method.lower())
        endpoint = request.path
        object_id = self._extract_object_id(request, response)
        content_type = self._extract_content_type(request)

        AuditEvent.objects.create(
            content_type=content_type,
            object_id=object_id or uuid.uuid4(),  # fallback UUID if we can't determine entity
            from_status="",  # Not a state transition — generic mutation audit
            to_status=action,  # Repurpose to_status to store the action type
            user=request.user,
            reason=f"Admin API: {request.method} {endpoint}",
        )

        logger.debug(
            "Audit event: user=%s action=%s endpoint=%s object_id=%s",
            request.user.get_username(),
            action,
            endpoint,
            object_id,
        )

    def _extract_object_id(self, request, response) -> uuid.UUID | None:
        """Extract the target object ID from the request URL or response body.

        Attempts multiple strategies:
        1. UUID in URL path segments (e.g., /api/admin/pages/{uuid}/)
        2. 'id' field in response data (for create operations)
        3. 'object_id' in request data (for workflow operations)
        """
        # Strategy 1: Extract UUID from URL path
        path_parts = request.path.rstrip("/").split("/")
        for part in reversed(path_parts):
            try:
                return uuid.UUID(part)
            except (ValueError, AttributeError):
                continue

        # Strategy 2: Get 'id' from response data (for POST/create)
        if hasattr(response, "data") and isinstance(response.data, dict):
            obj_id = response.data.get("id")
            if obj_id:
                try:
                    return uuid.UUID(str(obj_id))
                except (ValueError, AttributeError):
                    pass

        # Strategy 3: Get 'object_id' from request data (workflow operations)
        if hasattr(request, "data") and isinstance(request.data, dict):
            obj_id = request.data.get("object_id")
            if obj_id:
                try:
                    return uuid.UUID(str(obj_id))
                except (ValueError, AttributeError):
                    pass

        return None

    def _extract_content_type(self, request) -> ContentType:
        """Determine the content type from the admin URL path.

        Maps URL segments to Django app/model content types:
        - /api/admin/pages/... → cms.page
        - /api/admin/media/... → media.mediaasset
        - /api/admin/blog/... → blog.article
        - /api/admin/portfolio/... → portfolio.casestudy
        - /api/admin/workflow/... → workflow.auditevent (generic)
        """
        path = request.path

        # Map URL segments to app_label.model
        url_content_type_map = {
            "/api/admin/pages/": ("cms", "page"),
            "/api/admin/media/": ("media", "mediaasset"),
            "/api/admin/blog/": ("blog", "article"),
            "/api/admin/portfolio/": ("portfolio", "casestudy"),
            "/api/admin/workflow/": ("workflow", "auditevent"),
        }

        for prefix, (app_label, model) in url_content_type_map.items():
            if path.startswith(prefix):
                try:
                    return ContentType.objects.get(app_label=app_label, model=model)
                except ContentType.DoesNotExist:
                    break

        # Fallback: use a generic content type for the workflow app
        from apps.workflow.models import AuditEvent as AuditEventModel

        return ContentType.objects.get_for_model(AuditEventModel)
