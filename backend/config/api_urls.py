"""
API URL layout.

Two stable prefixes, mounted under `/api/` by `config.urls`:

    /api/public/...   anonymous, published content only
    /api/admin/...    authenticated admin surface (session auth + CSRF)

Feature apps append their routers to these includes in their own tasks
(cms 2.6/2.7, media 3.7, blog 4.6/4.7, portfolio 5.3/5.4, workflow 6.8).
"""

from django.urls import include, path

app_name = "api"

urlpatterns = [
    path("public/", include("apps.core.urls_public")),
    path("public/pages/", include("apps.cms.urls_public")),
    path("public/blog/", include("apps.blog.urls_public")),
    path("public/portfolio/", include("apps.portfolio.urls_public")),
    path("public/workflow/", include("apps.workflow.urls_public")),
    path("public/identity/", include("apps.identity.urls_public")),
    path("public/site/", include("apps.siteconfig.urls_public")),
    path("admin/", include("apps.core.urls_admin")),
    path("admin/pages/", include("apps.cms.urls_admin")),
    path("admin/media/", include("apps.media.urls_admin")),
    path("admin/blog/", include("apps.blog.urls_admin")),
    path("admin/portfolio/", include("apps.portfolio.urls_admin")),
    path("admin/workflow/", include("apps.workflow.urls_admin")),
    path("admin/identity/", include("apps.identity.urls_admin")),
    path("admin/site/", include("apps.siteconfig.urls_admin")),
]
