"""Dedicated public list/detail endpoints for published identity resources."""

from apps.core.exceptions import PROBLEM_CONTENT_TYPE, build_problem
from apps.core.pagination import DefaultPageNumberPagination
from apps.identity.models import Publication, ResearchProject
from apps.identity.serializers import PublicPublicationSerializer, PublicResearchProjectSerializer
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


def requested_locale(request) -> str:
    locale = request.query_params.get("locale", "en")
    return locale if locale in {"fa", "en"} else "en"


class PublicResourceListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    model = None
    serializer_class = None
    localized_field = "title"

    def get_queryset(self, locale):
        return self.model.objects.filter(
            status="published", **{f"{self.localized_field}_{locale}__gt": ""}
        )

    def filter_queryset(self, queryset):
        return queryset

    def get(self, request):
        locale = requested_locale(request)
        queryset = self.filter_queryset(self.get_queryset(locale))
        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = self.serializer_class(page, many=True, context={"locale": locale, "request": request})
        return paginator.get_paginated_response(serializer.data)


class PublicResourceDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    model = None
    serializer_class = None
    localized_field = "title"

    def get(self, request, slug):
        locale = requested_locale(request)
        instance = self.model.objects.filter(
            status="published",
            **{f"slug_{locale}": slug, f"{self.localized_field}_{locale}__gt": ""},
        ).first()
        if instance is None:
            problem = build_problem(status.HTTP_404_NOT_FOUND, "Published resource not found.", instance=request.path)
            return Response(problem, status=status.HTTP_404_NOT_FOUND, content_type=PROBLEM_CONTENT_TYPE)
        return Response(self.serializer_class(instance, context={"locale": locale, "request": request}).data)


class PublicResearchProjectListView(PublicResourceListView):
    model = ResearchProject
    serializer_class = PublicResearchProjectSerializer


class PublicResearchProjectDetailView(PublicResourceDetailView):
    model = ResearchProject
    serializer_class = PublicResearchProjectSerializer


class PublicPublicationListView(PublicResourceListView):
    model = Publication
    serializer_class = PublicPublicationSerializer

    def filter_queryset(self, queryset):
        publication_type = self.request.query_params.get("type")
        year = self.request.query_params.get("year")
        if publication_type:
            queryset = queryset.filter(publication_type=publication_type)
        if year and year.isdigit():
            queryset = queryset.filter(published_on__year=int(year))
        return queryset


class PublicPublicationDetailView(PublicResourceDetailView):
    model = Publication
    serializer_class = PublicPublicationSerializer
