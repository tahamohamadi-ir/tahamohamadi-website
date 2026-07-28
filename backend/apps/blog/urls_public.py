"""Blog public URL routing.

Mounted at /api/public/blog/ via config/api_urls.py.
Provides read-only access to published articles for anonymous users.
"""

from django.urls import path

from apps.blog.views import PublicArticleDetailView, PublicArticleListView

app_name = "blog-public"

urlpatterns = [
    path("articles/", PublicArticleListView.as_view(), name="article-list"),
    path("articles/<path:slug>/", PublicArticleDetailView.as_view(), name="article-detail"),
]
