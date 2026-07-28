"""Root URL configuration."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.core.views import problem_bad_request, problem_not_found, problem_server_error

urlpatterns = [
    # Django's own admin site is kept off /admin to leave that path to the
    # Next.js admin UI; the JSON admin API lives under /api/admin/.
    path("django-admin/", admin.site.urls),
    path("api/", include("config.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Errors raised outside DRF (URL resolver, unhandled exceptions) are rendered as
# RFC 7807 Problem Details too, so API clients always get one error shape.
handler400 = problem_bad_request
handler404 = problem_not_found
handler500 = problem_server_error
