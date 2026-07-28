"""CMS public URL routing.

Mounted at /api/public/pages/ via config/api_urls.py.
Provides read-only access to published pages for anonymous users.
"""

from django.urls import path

from apps.cms.views import PublicPageView

app_name = "cms-public"

urlpatterns = [
    path("<path:slug>/", PublicPageView.as_view(), name="page-detail"),
]
