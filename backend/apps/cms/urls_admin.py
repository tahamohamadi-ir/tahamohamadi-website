"""CMS admin URL routing.

Mounted at /api/admin/pages/ via config/api_urls.py.
Provides CRUD endpoints for Pages using DRF's DefaultRouter.
"""

from rest_framework.routers import DefaultRouter

from apps.cms.views import AdminPageViewSet

router = DefaultRouter()
router.register("", AdminPageViewSet, basename="admin-pages")

urlpatterns = router.urls
