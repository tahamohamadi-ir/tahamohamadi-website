"""Public (anonymous) core routes, mounted at /api/public/."""

from django.urls import path

from apps.core.views import PublicContactView, PublicHealthView

app_name = "core-public"

urlpatterns = [
    path("health/", PublicHealthView.as_view(), name="health"),
    path("contact/", PublicContactView.as_view(), name="contact"),
]
