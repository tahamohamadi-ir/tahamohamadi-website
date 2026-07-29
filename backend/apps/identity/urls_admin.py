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
    AdminPublicationViewSet,
    AdminResearchInterestViewSet,
    AdminResearchProjectViewSet,
    AdminResumeVariantViewSet,
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
router.register("research-projects", AdminResearchProjectViewSet, basename="admin-identity-research-projects")
router.register("research-interests", AdminResearchInterestViewSet, basename="admin-identity-research-interests")
router.register("publications", AdminPublicationViewSet, basename="admin-identity-publications")
router.register("resumes", AdminResumeVariantViewSet, basename="admin-identity-resumes")

urlpatterns = router.urls
