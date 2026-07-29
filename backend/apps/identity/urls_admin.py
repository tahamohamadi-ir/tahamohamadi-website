from rest_framework.routers import DefaultRouter

from apps.identity.views import (
    AdminSiteProfileViewSet,
    AdminSkillViewSet,
    AdminSocialLinkViewSet,
)

router = DefaultRouter()
router.register("profiles", AdminSiteProfileViewSet, basename="admin-identity-profiles")
router.register("social-links", AdminSocialLinkViewSet, basename="admin-identity-social-links")
router.register("skills", AdminSkillViewSet, basename="admin-identity-skills")

urlpatterns = router.urls
