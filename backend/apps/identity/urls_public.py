from django.urls import path

from apps.identity.views import PublicIdentityView

urlpatterns = [path("", PublicIdentityView.as_view(), name="public-identity")]
