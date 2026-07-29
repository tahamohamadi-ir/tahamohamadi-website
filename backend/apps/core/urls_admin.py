"""Authenticated core routes, mounted at /api/admin/."""

from django.urls import path

from apps.core.views import AdminDashboardView, AdminHealthView, AdminSeedReviewView, SessionLoginView, SessionLogoutView

app_name = "core-admin"

urlpatterns = [
    path("health/", AdminHealthView.as_view(), name="health"),
    path("dashboard/", AdminDashboardView.as_view(), name="dashboard"),
    path("seed-review/", AdminSeedReviewView.as_view(), name="seed-review"),
    path("login/", SessionLoginView.as_view(), name="login"),
    path("logout/", SessionLogoutView.as_view(), name="logout"),
]
