"""Custom throttle classes for endpoint-specific rate limiting.

Rates (Requirements 3.7, 12.5):
- Login: 5/min (brute-force protection)
- Upload: 20/min (resource-intensive operation)
- Public API anonymous: 100/min
- Public API authenticated: 1000/min
"""

from __future__ import annotations

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Strict rate limit for login attempts: 5 requests per minute.

    Uses the client IP address as the cache key, so brute-force attempts from a
    single origin are blocked regardless of whether the user is authenticated.
    """

    scope = "login"


class UploadRateThrottle(UserRateThrottle):
    """Rate limit for media uploads: 20 requests per minute.

    Applied to authenticated upload endpoints to prevent resource exhaustion
    from rapid bulk uploads.
    """

    scope = "upload"


class PublicAnonRateThrottle(AnonRateThrottle):
    """Rate limit for anonymous public API requests: 100 requests per minute."""

    scope = "public_anon"


class PublicUserRateThrottle(UserRateThrottle):
    """Rate limit for authenticated public API requests: 1000 requests per minute."""

    scope = "public_user"
