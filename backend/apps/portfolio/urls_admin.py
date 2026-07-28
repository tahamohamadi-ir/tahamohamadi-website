"""Portfolio admin API URLs.

Mounted at /api/admin/portfolio/ via config/api_urls.py.
Provides CRUD endpoints for CaseStudy using DRF's DefaultRouter.
"""

from rest_framework.routers import DefaultRouter

from apps.portfolio.views import AdminCaseStudyViewSet

router = DefaultRouter()
router.register("", AdminCaseStudyViewSet, basename="admin-casestudies")

urlpatterns = router.urls
