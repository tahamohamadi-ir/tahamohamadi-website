"""
Project-setup tests for task 1.2.

These use `SimpleTestCase` only, so the suite runs without a live PostgreSQL
instance. Database-backed tests arrive with the models in task 1.7 and the
pytest configuration in task 1.9.
"""

import json

from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework import status

from apps.core.exceptions import PROBLEM_CONTENT_TYPE, build_problem, problem_type_uri


class ProblemDetailBuilderTests(SimpleTestCase):
    def test_build_problem_includes_required_rfc7807_members(self):
        problem = build_problem(404, "Nothing here.", instance="/api/public/pages/x")

        self.assertEqual(problem["type"], problem_type_uri(404))
        self.assertEqual(problem["title"], "Resource not found")
        self.assertEqual(problem["status"], 404)
        self.assertEqual(problem["detail"], "Nothing here.")
        self.assertEqual(problem["instance"], "/api/public/pages/x")
        self.assertNotIn("errors", problem)

    def test_build_problem_includes_field_errors_when_provided(self):
        problem = build_problem(422, "Invalid.", errors={"slug_fa": ["Required."]})

        self.assertEqual(problem["errors"], {"slug_fa": ["Required."]})

    def test_problem_type_uri_is_stable_per_status(self):
        self.assertTrue(problem_type_uri(409).endswith("/problems/conflict"))
        self.assertTrue(problem_type_uri(422).endswith("/problems/validation-error"))


class HealthEndpointTests(SimpleTestCase):
    def test_public_health_is_open_and_reports_locales(self):
        response = self.client.get(reverse("api:core-public:health"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["locales"], ["fa", "en"])

    def test_admin_health_requires_authentication(self):
        response = self.client.get(reverse("api:core-admin:health"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.headers["Content-Type"], PROBLEM_CONTENT_TYPE)
        body = json.loads(response.content)
        self.assertEqual(body["status"], 403)
        self.assertEqual(body["instance"], "/api/admin/health/")


class UnknownRouteTests(SimpleTestCase):
    def test_unknown_api_route_returns_problem_json(self):
        response = self.client.get("/api/public/does-not-exist/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.headers["Content-Type"], PROBLEM_CONTENT_TYPE)
        body = json.loads(response.content)
        self.assertEqual(body["title"], "Resource not found")
