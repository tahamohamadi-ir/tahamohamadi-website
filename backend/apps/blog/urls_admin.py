"""Blog admin URL routing.

Mounted at /api/admin/blog/ via config/api_urls.py.
Provides CRUD endpoints for Articles and Topics using DRF's DefaultRouter.
"""

from rest_framework.routers import DefaultRouter

from apps.blog.views import AdminArticleViewSet, AdminTopicViewSet

router = DefaultRouter()
router.register("articles", AdminArticleViewSet, basename="admin-articles")
router.register("topics", AdminTopicViewSet, basename="admin-topics")

urlpatterns = router.urls
