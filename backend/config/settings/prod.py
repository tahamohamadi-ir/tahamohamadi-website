"""
Production settings.

Secrets and hosts are mandatory here: startup fails fast when they are missing
rather than silently running with insecure development defaults.
"""

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import env

DEBUG = False

SECRET_KEY = env("DJANGO_SECRET_KEY")
if SECRET_KEY.startswith("dev-insecure"):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set to a real secret in production.")

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must be set in production.")

# Requests arrive through the Nginx reverse proxy (configured in task 1.5).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# --- Security headers (task 9.1) ----------------------------------------
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# X-Content-Type-Options: nosniff
SECURE_CONTENT_TYPE_NOSNIFF = True

# X-Frame-Options: DENY — prevents clickjacking
X_FRAME_OPTIONS = "DENY"

# HSTS: instruct browsers to only access over HTTPS for 1 year
# Nginx also sets this header; Django's SecurityMiddleware adds it to responses
# that pass through Django directly.
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Referrer-Policy (Django 4.1+ via SecurityMiddleware)
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Cross-Origin-Opener-Policy (Django 4.0+ SecurityMiddleware)
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

# --- CORS (prod) --------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
if not CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS must be set in production.")

# --- CSRF (prod) --------------------------------------------------------
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")
if not CSRF_TRUSTED_ORIGINS:
    raise ImproperlyConfigured("CSRF_TRUSTED_ORIGINS must be set in production.")

# --- Sentry (error tracking + performance monitoring) -------------------
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        # Capture 10% of transactions for performance monitoring
        traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.1),
        # Send associated PII (user IPs, usernames) for debugging
        send_default_pii=True,
        # Tag with environment for filtering in Sentry UI
        environment=env("ENVIRONMENT", default="prod"),
    )
