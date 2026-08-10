"""Development settings: verbose errors, relaxed hosts, local media serving."""

from .base import *  # noqa: F403
from .base import MIDDLEWARE, env  # noqa: F401

DEBUG = env.bool("DJANGO_DEBUG", default=True)

ALLOWED_HOSTS = env.list(
    "DJANGO_ALLOWED_HOSTS",
    default=["localhost", "127.0.0.1", "0.0.0.0", "backend", "testserver"],
)

# `runserver` serves static files itself; WhiteNoise is a production concern and
# would otherwise warn about the missing (uncollected) STATIC_ROOT.
MIDDLEWARE = [m for m in MIDDLEWARE if "whitenoise" not in m]

# Plain storage in dev: no manifest hashing, so `runserver` works without collectstatic.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Emails to console instead of a real SMTP server.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# --- CORS (dev) ---------------------------------------------------------
# Allow all origins in development for convenience with the local Next.js app.
CORS_ALLOW_ALL_ORIGINS = True

# --- CSRF (dev) ---------------------------------------------------------
CSRF_TRUSTED_ORIGINS = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:3000",
]
