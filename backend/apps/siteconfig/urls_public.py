from django.urls import path

from apps.siteconfig.views import PublicSiteConfigView

urlpatterns = [path("", PublicSiteConfigView.as_view(), name="public-site-config")]
