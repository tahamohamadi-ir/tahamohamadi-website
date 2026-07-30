"""Custom throttle classes for endpoint-specific rate limiting.

Rates (Requirements 3.7, 12.5):
- Login: 5/min (brute-force protection)
- Upload: 20/min (resource-intensive operation)
- Public API anonymous: 100/min
- Public API authenticated: 1000/min
"""

from __future__ import annotations

from rest_framework.settings import api_settings
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class ConfiguredRateThrottle:
    """Resolve rates from the active DRF settings at throttle construction."""

    def get_rate(self):
        try:
            return api_settings.DEFAULT_THROTTLE_RATES[self.scope]
        except KeyError as exc:
            raise RuntimeError(
                f"No default throttle rate set for scope '{self.scope}'"
            ) from exc


class LoginRateThrottle(ConfiguredRateThrottle, AnonRateThrottle):
    """Strict rate limit for login attempts: 5 requests per minute.

    Uses the client IP address as the cache key, so brute-force attempts from a
    single origin are blocked regardless of whether the user is authenticated.
    """

    scope = "login"


class UploadRateThrottle(ConfiguredRateThrottle, UserRateThrottle):
    """Rate limit for media uploads: 20 requests per minute.

    Applied to authenticated upload endpoints to prevent resource exhaustion
    from rapid bulk uploads.
    """

    scope = "upload"


class ContactRateThrottle(ConfiguredRateThrottle, AnonRateThrottle):
    """Restrict public contact submissions independently from general API traffic."""

    scope = "contact"


class PublicAnonRateThrottle(ConfiguredRateThrottle, AnonRateThrottle):
    """Rate limit for anonymous public API requests: 100 requests per minute."""

    scope = "public_anon"


class PublicUserRateThrottle(ConfiguredRateThrottle, UserRateThrottle):
    """Rate limit for authenticated public API requests: 1000 requests per minute."""

    scope = "public_user"
