"""Authenticated core routes, mounted at /api/admin/."""

from django.urls import path

from apps.core.views import AdminDashboardView, AdminHealthView, SessionLoginView, SessionLogoutView

app_name = "core-admin"

urlpatterns = [
    path("health/", AdminHealthView.as_view(), name="health"),
    path("dashboard/", AdminDashboardView.as_view(), name="dashboard"),
    path("login/", SessionLoginView.as_view(), name="login"),
    path("logout/", SessionLogoutView.as_view(), name="logout"),
]
