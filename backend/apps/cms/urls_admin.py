"""CMS admin URL routing.

Mounted at /api/admin/pages/ via config/api_urls.py.
Provides CRUD endpoints for Pages using DRF's DefaultRouter.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.cms.views import (
    AdminComposerTemplateImportView,
    AdminComposerTemplateListCreateView,
    AdminPageViewSet,
)

router = DefaultRouter()
router.register("", AdminPageViewSet, basename="admin-pages")

urlpatterns = [
    path(
        "templates/import/",
        AdminComposerTemplateImportView.as_view(),
        name="admin-composer-template-import",
    ),
    path(
        "templates/",
        AdminComposerTemplateListCreateView.as_view(),
        name="admin-composer-template-list-create",
    ),
    *router.urls,
]
