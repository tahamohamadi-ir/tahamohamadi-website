"""Authenticated core routes, mounted at /api/admin/."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.core.views import (
    AdminContactMessageViewSet,
    AdminContentHealthView,
    AdminDashboardView,
    AdminHealthView,
    AdminSeedReviewView,
    SessionLoginView,
    SessionLogoutView,
)

app_name = "core-admin"

router = DefaultRouter()
router.register("contact-messages", AdminContactMessageViewSet, basename="admin-contact-messages")

urlpatterns = [
    path("health/", AdminHealthView.as_view(), name="health"),
    path("content-health/", AdminContentHealthView.as_view(), name="content-health"),
    path("dashboard/", AdminDashboardView.as_view(), name="dashboard"),
    path("seed-review/", AdminSeedReviewView.as_view(), name="seed-review"),
    path("login/", SessionLoginView.as_view(), name="login"),
    path("logout/", SessionLogoutView.as_view(), name="logout"),
] + router.urls
