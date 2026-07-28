"""Authenticated core routes, mounted at /api/admin/."""

from django.urls import path

from apps.core.views import AdminHealthView

app_name = "core-admin"

urlpatterns = [
    path("health/", AdminHealthView.as_view(), name="health"),
]
