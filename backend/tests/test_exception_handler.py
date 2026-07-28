"""
Tests for the RFC 7807 Problem Details exception handler.

Validates that all error responses conform to the Problem Details format
and that various exception types (DRF, Django, custom) are handled correctly.
"""

import pytest
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.test import RequestFactory
from rest_framework.exceptions import (
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.views import APIView

from apps.core.exceptions import (
    PROBLEM_CONTENT_TYPE,
    ConflictError,
    build_problem,
    problem_detail_exception_handler,
    problem_title,
    problem_type_uri,
)


@pytest.fixture
def request_context():
    """Create a minimal DRF-compatible request context."""
    factory = RequestFactory()
    request = factory.get("/api/admin/pages/1")
    view = APIView()
    return {"request": request, "view": view}


class TestBuildProblem:
    """Verify the Problem Details body builder."""

    def test_minimal_problem(self):
        problem = build_problem(404, "Not found")
        assert problem["type"] == "https://tahamohamadi.ir/problems/not-found"
        assert problem["title"] == "Resource not found"
        assert problem["status"] == 404
        assert problem["detail"] == "Not found"
        assert "instance" not in problem
        assert "errors" not in problem

    def test_problem_with_instance(self):
        problem = build_problem(400, "Bad request", instance="/api/admin/pages/1")
        assert problem["instance"] == "/api/admin/pages/1"

    def test_problem_with_errors(self):
        errors = {"slug_fa": ["This field is required."]}
        problem = build_problem(422, "Validation error", errors=errors)
        assert problem["errors"] == errors

    def test_problem_with_extra(self):
        extra = {"current_version": 5}
        problem = build_problem(409, "Conflict", extra=extra)
        assert problem["current_version"] == 5

    def test_unknown_status_code(self):
        problem = build_problem(418, "I'm a teapot")
        assert problem["type"] == "https://tahamohamadi.ir/problems/error"
        assert problem["title"] == "Error"
        assert problem["status"] == 418


class TestProblemTypeUri:
    """Verify URI generation for problem types."""

    def test_known_codes(self):
        assert problem_type_uri(400) == "https://tahamohamadi.ir/problems/bad-request"
        assert problem_type_uri(401) == "https://tahamohamadi.ir/problems/unauthenticated"
        assert problem_type_uri(403) == "https://tahamohamadi.ir/problems/forbidden"
        assert problem_type_uri(404) == "https://tahamohamadi.ir/problems/not-found"
        assert problem_type_uri(409) == "https://tahamohamadi.ir/problems/conflict"
        assert problem_type_uri(422) == "https://tahamohamadi.ir/problems/validation-error"
        assert problem_type_uri(429) == "https://tahamohamadi.ir/problems/rate-limited"
        assert problem_type_uri(500) == "https://tahamohamadi.ir/problems/server-error"

    def test_unknown_code_falls_back(self):
        assert problem_type_uri(418) == "https://tahamohamadi.ir/problems/error"


class TestProblemTitle:
    """Verify human-readable title generation."""

    def test_known_codes(self):
        assert problem_title(400) == "Bad request"
        assert problem_title(404) == "Resource not found"
        assert problem_title(409) == "Version conflict"

    def test_unknown_code(self):
        assert problem_title(418) == "Error"


class TestProblemDetailExceptionHandler:
    """Verify the DRF exception handler returns RFC 7807 responses."""

    def test_drf_validation_error(self, request_context):
        exc = ValidationError({"slug_fa": ["This field is required."]})
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 422
        assert response.content_type == PROBLEM_CONTENT_TYPE
        assert response.data["type"] == "https://tahamohamadi.ir/problems/validation-error"
        assert response.data["title"] == "Validation error"
        assert response.data["status"] == 422
        assert response.data["detail"] == "One or more fields are invalid."
        assert response.data["errors"]["slug_fa"] == ["This field is required."]
        assert response.data["instance"] == "/api/admin/pages/1"

    def test_drf_validation_error_non_field(self, request_context):
        exc = ValidationError(["Non-field error one", "Non-field error two"])
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 422
        assert response.data["errors"]["non_field_errors"] == [
            "Non-field error one",
            "Non-field error two",
        ]

    def test_drf_not_found(self, request_context):
        exc = NotFound()
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 404
        assert response.data["type"] == "https://tahamohamadi.ir/problems/not-found"
        assert response.data["title"] == "Resource not found"
        assert response.data["status"] == 404

    def test_drf_permission_denied(self, request_context):
        exc = PermissionDenied()
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 403
        assert response.data["type"] == "https://tahamohamadi.ir/problems/forbidden"
        assert response.data["status"] == 403

    def test_drf_not_authenticated(self, request_context):
        exc = NotAuthenticated()
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 401
        assert response.data["type"] == "https://tahamohamadi.ir/problems/unauthenticated"
        assert response.data["status"] == 401

    def test_drf_authentication_failed(self, request_context):
        exc = AuthenticationFailed()
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 401
        assert response.data["type"] == "https://tahamohamadi.ir/problems/unauthenticated"

    def test_drf_method_not_allowed(self, request_context):
        exc = MethodNotAllowed("POST")
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 405
        assert response.data["type"] == "https://tahamohamadi.ir/problems/method-not-allowed"

    def test_drf_throttled(self, request_context):
        exc = Throttled(wait=60)
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 429
        assert response.data["type"] == "https://tahamohamadi.ir/problems/rate-limited"

    def test_conflict_error(self, request_context):
        exc = ConflictError()
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 409
        assert response.data["type"] == "https://tahamohamadi.ir/problems/conflict"
        assert response.data["title"] == "Version conflict"
        assert response.data["status"] == 409

    def test_conflict_error_with_extra(self, request_context):
        exc = ConflictError(detail="Resource modified")
        exc.extra = {"current_version": 5}
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 409
        assert response.data["current_version"] == 5

    def test_django_validation_error_dict(self, request_context):
        exc = DjangoValidationError({"name": ["This field cannot be blank."]})
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 422
        assert response.data["errors"]["name"] == ["This field cannot be blank."]

    def test_django_validation_error_list(self, request_context):
        exc = DjangoValidationError(["Something is wrong."])
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 422
        assert response.data["errors"]["non_field_errors"] == ["Something is wrong."]

    def test_django_permission_denied(self, request_context):
        exc = DjangoPermissionDenied("No access")
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 403
        assert response.data["type"] == "https://tahamohamadi.ir/problems/forbidden"

    def test_django_http404(self, request_context):
        exc = Http404("Page not found")
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 404
        assert response.data["type"] == "https://tahamohamadi.ir/problems/not-found"
        assert response.data["title"] == "Resource not found"
        assert "Page not found" in response.data["detail"]

    def test_django_http404_empty_message(self, request_context):
        exc = Http404()
        response = problem_detail_exception_handler(exc, request_context)

        assert response is not None
        assert response.status_code == 404
        assert response.data["detail"] == "The requested resource was not found."

    def test_unhandled_exception_returns_none(self, request_context):
        """Exceptions not handled by DRF should return None (500 from Django)."""
        exc = RuntimeError("Unexpected error")
        response = problem_detail_exception_handler(exc, request_context)

        assert response is None

    def test_content_type_is_problem_json(self, request_context):
        exc = NotFound()
        response = problem_detail_exception_handler(exc, request_context)

        assert response.content_type == "application/problem+json"

    def test_instance_is_request_path(self, request_context):
        exc = NotFound()
        response = problem_detail_exception_handler(exc, request_context)

        assert response.data["instance"] == "/api/admin/pages/1"

    def test_all_responses_have_required_fields(self, request_context):
        """Every problem response must have type, title, status, detail."""
        exceptions = [
            ValidationError({"field": ["Error"]}),
            NotFound(),
            PermissionDenied(),
            NotAuthenticated(),
            ConflictError(),
        ]
        for exc in exceptions:
            response = problem_detail_exception_handler(exc, request_context)
            assert response is not None, f"Handler returned None for {type(exc).__name__}"
            assert "type" in response.data
            assert "title" in response.data
            assert "status" in response.data
            assert "detail" in response.data
