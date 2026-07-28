"""Public (anonymous) core routes, mounted at /api/public/."""

from django.urls import path

from apps.core.views import PublicHealthView

app_name = "core-public"

urlpatterns = [
    path("health/", PublicHealthView.as_view(), name="health"),
]
