"""
Base Django settings shared by all environments.

Every environment-specific value is read from the environment, optionally via a
`.env` file at the backend root (the full template lands in task 1.6). Defaults
are development-friendly so the project runs locally without configuration;
production overrides in `prod.py` fail loudly when secrets are missing.
"""

from pathlib import Path

import environ

# backend/config/settings/base.py -> backend/ (the directory holding manage.py)
BASE_DIR = Path(__file__).resolve().parents[2]

env = environ.Env()

ENV_FILE = BASE_DIR / ".env"
if ENV_FILE.exists():
    env.read_env(str(ENV_FILE))


# --- Core ---------------------------------------------------------------

SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-insecure-secret-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Applications -------------------------------------------------------
# Modular monolith: each domain is a Django app under `apps/`. The remaining
# apps are added by their own tasks: cms (2.1), media (3.1), blog (4.1),
# portfolio (5.1), workflow (6.1).

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "django_filters",
    "corsheaders",
]

LOCAL_APPS = [
    "apps.core",
    "apps.cms",
    "apps.media",
    "apps.blog",
    "apps.portfolio",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# --- Middleware ---------------------------------------------------------

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# --- Database -----------------------------------------------------------
# PostgreSQL is the sole datastore; there is no SQLite fallback.

DATABASES = {
    "default": env.db_url(
        "DATABASE_URL",
        default="postgres://postgres:postgres@localhost:5432/tahamohamadi_v2",
    ),
}
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DATABASE_CONN_MAX_AGE", default=60)


# --- Authentication -----------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# --- Session ------------------------------------------------------------
# Session-based auth (not JWT). Admin requests require a valid session cookie.

SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 86400 * 14  # 2 weeks


# --- CSRF ---------------------------------------------------------------
# CSRF_COOKIE_HTTPONLY is False so Next.js can read the token from the cookie.

CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])


# --- CORS ---------------------------------------------------------------
# django-cors-headers: credentials must be allowed for session cookies to be
# sent cross-origin from the Next.js frontend.

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True


# --- Internationalization ----------------------------------------------
# Persian and English are independent; there is no cross-locale fallback.
# Content locales are stored in separate model columns, so Django's own
# translation machinery only covers framework-level strings.

LANGUAGE_CODE = "en"
LANGUAGES = [
    ("fa", "Persian"),
    ("en", "English"),
]
CONTENT_LOCALES = ["fa", "en"]
DEFAULT_CONTENT_LOCALE = "fa"

TIME_ZONE = env("DJANGO_TIME_ZONE", default="Asia/Tehran")
USE_I18N = True
USE_TZ = True


# --- Static and media ---------------------------------------------------

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = Path(env("DJANGO_MEDIA_ROOT", default=str(BASE_DIR / "media")))

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}


# --- Django REST Framework ---------------------------------------------
# Public APIs are served under /api/public/ and admin APIs under /api/admin/.
# Serializers act as DTOs; business rules live in each app's services module.
# Errors are rendered as RFC 7807 Problem Details.

REST_FRAMEWORK = {
    # Session-based authentication for admin APIs. Public APIs opt in with AllowAny.
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    # Fail closed: views that should be public must opt in with AllowAny.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.DefaultPageNumberPagination",
    "PAGE_SIZE": env.int("API_PAGE_SIZE", default=20),
    "EXCEPTION_HANDLER": "apps.core.exceptions.problem_detail_exception_handler",
    "UNAUTHENTICATED_USER": "django.contrib.auth.models.AnonymousUser",
}

# Absolute base for the RFC 7807 `type` URI of each problem response.
PROBLEM_TYPE_BASE_URI = env(
    "PROBLEM_TYPE_BASE_URI",
    default="https://tahamohamadi.ir/problems",
)


# --- Logging ------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": env("DJANGO_LOG_LEVEL", default="INFO"),
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
