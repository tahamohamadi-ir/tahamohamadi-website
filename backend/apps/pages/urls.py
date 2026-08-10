"""Page Builder admin APIs."""

from rest_framework.routers import DefaultRouter

from apps.pages.views import BuilderPageViewSet

app_name = "pages"

router = DefaultRouter()
router.register("pages", BuilderPageViewSet, basename="page")

urlpatterns = router.urls
