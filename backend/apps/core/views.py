"""Core views: health probes and the plain-Django error handlers."""

from __future__ import annotations

import django
from django.conf import settings
from django.http import JsonResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import problem_json_response


class PublicHealthView(APIView):
    """`GET /api/public/health/` — unauthenticated liveness probe."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response(
            {
                "status": "ok",
                "service": "tahamohamadi-backend",
                "django_version": django.get_version(),
                "locales": list(settings.CONTENT_LOCALES),
            },
            status=status.HTTP_200_OK,
        )


class AdminHealthView(APIView):
    """`GET /api/admin/health/` — authenticated probe for the admin surface."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(
            {
                "status": "ok",
                "user": request.user.get_username(),
            },
            status=status.HTTP_200_OK,
        )


# --- Plain-Django error handlers (wired in config/urls.py) ------------------


def problem_bad_request(request, exception=None) -> JsonResponse:
    return problem_json_response(request, 400, "The request could not be understood.")


def problem_not_found(request, exception=None) -> JsonResponse:
    return problem_json_response(request, 404, "The requested resource was not found.")


def problem_server_error(request) -> JsonResponse:
    return problem_json_response(request, 500, "An unexpected error occurred.")
