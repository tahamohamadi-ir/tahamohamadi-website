from rest_framework.routers import DefaultRouter

from apps.siteconfig.views import AdminNavigationItemViewSet, AdminRedirectRuleViewSet, AdminSiteSettingsViewSet

router = DefaultRouter()
router.register("settings", AdminSiteSettingsViewSet, basename="admin-site-settings")
router.register("navigation", AdminNavigationItemViewSet, basename="admin-site-navigation")
router.register("redirects", AdminRedirectRuleViewSet, basename="admin-site-redirects")

urlpatterns = router.urls
