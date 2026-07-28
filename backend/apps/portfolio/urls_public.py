"""Portfolio public API URLs.

Mounted at /api/public/portfolio/ via config/api_urls.py.
Provides read-only access to published case studies for anonymous users.
"""

from django.urls import path

from apps.portfolio.views import PublicCaseStudyDetailView, PublicCaseStudyListView

app_name = "portfolio-public"

urlpatterns = [
    path("", PublicCaseStudyListView.as_view(), name="casestudy-list"),
    path("<path:slug>/", PublicCaseStudyDetailView.as_view(), name="casestudy-detail"),
]
