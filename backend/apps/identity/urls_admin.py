from rest_framework.routers import DefaultRouter

from apps.identity.views import (
    AdminSiteProfileViewSet,
    AdminSkillViewSet,
    AdminSocialLinkViewSet,
    AdminExperienceViewSet,
    AdminEducationViewSet,
    AdminCertificationViewSet,
    AdminAffiliationViewSet,
    AdminLanguageProficiencyViewSet,
)

router = DefaultRouter()
router.register("profiles", AdminSiteProfileViewSet, basename="admin-identity-profiles")
router.register("social-links", AdminSocialLinkViewSet, basename="admin-identity-social-links")
router.register("skills", AdminSkillViewSet, basename="admin-identity-skills")
router.register("experience", AdminExperienceViewSet, basename="admin-identity-experience")
router.register("education", AdminEducationViewSet, basename="admin-identity-education")
router.register("certifications", AdminCertificationViewSet, basename="admin-identity-certifications")
router.register("affiliations", AdminAffiliationViewSet, basename="admin-identity-affiliations")
router.register("languages", AdminLanguageProficiencyViewSet, basename="admin-identity-languages")

urlpatterns = router.urls
