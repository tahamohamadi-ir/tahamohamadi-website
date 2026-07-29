"""Cache-Control middleware for route-based caching policy.

Sets appropriate Cache-Control headers based on the request path:
- Public API: CDN-cacheable (s-maxage=3600, stale-while-revalidate=86400)
- Admin API: no-cache, no-store, must-revalidate
- Preview: no-store + X-Robots-Tag: noindex
- Media files: immutable with long max-age (handled by Nginx, but belt-and-suspenders)

This middleware acts as a defense-in-depth layer complementing Nginx headers.
Nginx's add_header directive will override these for proxied responses, but
this ensures correct headers even when Django is accessed directly (e.g., dev).

Requirements: 13.4
"""

from __future__ import annotations


# Path prefixes for route classification
PUBLIC_API_PREFIX = "/api/public/"
ADMIN_API_PREFIX = "/api/admin/"
PREVIEW_PATH = "/api/public/workflow/preview/"
MEDIA_PREFIX = "/media/"


class CacheControlMiddleware:
    """Set Cache-Control headers per route type.

    Route policies:
    - /api/public/workflow/preview/ → no-store, X-Robots-Tag: noindex
    - /api/public/* → public, s-maxage=3600, stale-while-revalidate=86400
    - /api/admin/* → no-cache, no-store, must-revalidate
    - /media/* → public, max-age=31536000, immutable
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        path = request.path

        # Skip if the view already explicitly set Cache-Control
        if response.get("Cache-Control"):
            return response

        if path.startswith(PREVIEW_PATH):
            response["Cache-Control"] = "no-store"
            response["X-Robots-Tag"] = "noindex"
        elif path.startswith(ADMIN_API_PREFIX):
            response["Cache-Control"] = "no-cache, no-store, must-revalidate"
        elif path.startswith(PUBLIC_API_PREFIX):
            response["Cache-Control"] = "public, s-maxage=3600, stale-while-revalidate=86400"
        elif path.startswith(MEDIA_PREFIX):
            response["Cache-Control"] = "public, max-age=31536000, immutable"

        return response
