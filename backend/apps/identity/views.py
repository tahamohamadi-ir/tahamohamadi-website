from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.models import SiteProfile, Skill, SocialLink
from apps.identity.serializers import (
    PublicIdentitySerializer,
    PublicSkillSerializer,
    PublicSocialLinkSerializer,
)


class PublicIdentityView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        locale = request.query_params.get("locale", "en")
        if locale not in {"fa", "en"}:
            locale = "en"
        profile = SiteProfile.objects.filter(status="published").select_related("portrait").first()
        if profile is None:
            return Response({"profile": None, "social_links": [], "skills": []})
        context = {"locale": locale, "request": request}
        return Response({
            "profile": PublicIdentitySerializer(profile, context=context).data,
            "social_links": PublicSocialLinkSerializer(
                SocialLink.objects.filter(status="published"), many=True, context=context
            ).data,
            "skills": PublicSkillSerializer(
                Skill.objects.filter(status="published"), many=True, context=context
            ).data,
        })
