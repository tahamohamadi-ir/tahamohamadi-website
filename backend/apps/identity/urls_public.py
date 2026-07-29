from django.urls import path

from apps.identity.public_resources import (
    PublicPublicationDetailView,
    PublicPublicationListView,
    PublicResearchProjectDetailView,
    PublicResearchProjectListView,
)
from apps.identity.views import PublicIdentityView

urlpatterns = [
    path("", PublicIdentityView.as_view(), name="public-identity"),
    path("research-projects/", PublicResearchProjectListView.as_view(), name="public-research-project-list"),
    path("research-projects/<str:slug>/", PublicResearchProjectDetailView.as_view(), name="public-research-project-detail"),
    path("publications/", PublicPublicationListView.as_view(), name="public-publication-list"),
    path("publications/<str:slug>/", PublicPublicationDetailView.as_view(), name="public-publication-detail"),
]
