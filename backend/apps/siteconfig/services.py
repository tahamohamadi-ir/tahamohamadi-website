"""Public projections and cache validators for site configuration."""

import hashlib
import json

from rest_framework import status
from rest_framework.response import Response

from apps.siteconfig.models import NavigationItem, SiteSettings
from apps.siteconfig.serializers import PublicNavigationItemSerializer, PublicSiteSettingsSerializer


def public_site_payload(locale: str, request):
    context = {"locale": locale, "request": request}
    settings = SiteSettings.objects.filter(status="published", **{f"site_title_{locale}__gt": ""}).select_related("default_og_image").first()
    navigation = NavigationItem.objects.filter(status="published", **{f"label_{locale}__gt": ""})
    return {
        "settings": PublicSiteSettingsSerializer(settings, context=context).data if settings else None,
        "navigation": {
            "header": PublicNavigationItemSerializer(navigation.filter(location="header"), many=True, context=context).data,
            "footer": PublicNavigationItemSerializer(navigation.filter(location="footer"), many=True, context=context).data,
        },
    }


def conditional_public_response(request, payload):
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str, separators=(",", ":")).encode()
    etag = f'"{hashlib.sha256(encoded).hexdigest()}"'
    headers = {"ETag": etag, "Cache-Control": "public, max-age=60, stale-while-revalidate=300"}
    if request.headers.get("If-None-Match") == etag:
        return Response(status=status.HTTP_304_NOT_MODIFIED, headers=headers)
    return Response(payload, headers=headers)
