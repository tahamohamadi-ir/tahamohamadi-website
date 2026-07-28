"""Media admin URL routing.

Mounted at /api/admin/media/ via config/api_urls.py.
Provides upload, list, detail, update, archive, and unarchive endpoints
using DRF's DefaultRouter.
"""

from rest_framework.routers import DefaultRouter

from apps.media.views import AdminMediaViewSet

router = DefaultRouter()
router.register("", AdminMediaViewSet, basename="admin-media")

urlpatterns = router.urls
