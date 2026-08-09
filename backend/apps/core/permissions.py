"""Role-Based Access Control (RBAC) permissions.

Defines the core roles for the CMS and DRF permission classes to enforce them.
See ADR-013 for the full access matrix.
"""

from rest_framework.permissions import BasePermission, IsAuthenticated


class Roles:
    """Standard role names used in Django Groups."""

    SITE_OWNER = "Site Owner"  # Usually inferred from is_superuser
    ADMIN = "Admin"
    PUBLISHER = "Publisher"
    REVIEWER = "Reviewer"
    CONTENT_EDITOR = "Content Editor"


def user_has_role(user, role: str) -> bool:
    """Check if the user has the specified role (or is a superuser)."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(name=role).exists()


def get_user_roles(user) -> list[str]:
    """Get a list of all role names the user has."""
    if not user or not user.is_authenticated:
        return []
    roles = [group.name for group in user.groups.all()]
    if user.is_superuser and Roles.SITE_OWNER not in roles:
        roles.append(Roles.SITE_OWNER)
    return roles


class IsAdminRole(BasePermission):
    """Allows access only to Admins and Site Owners."""

    def has_permission(self, request, view):
        return user_has_role(request.user, Roles.ADMIN)


class IsPublisherRole(BasePermission):
    """Allows access to Publishers, Admins, and Site Owners."""

    def has_permission(self, request, view):
        return user_has_role(request.user, Roles.ADMIN) or user_has_role(
            request.user, Roles.PUBLISHER
        )


class IsReviewerRole(BasePermission):
    """Allows access to Reviewers, Publishers, Admins, and Site Owners."""

    def has_permission(self, request, view):
        return (
            user_has_role(request.user, Roles.ADMIN)
            or user_has_role(request.user, Roles.PUBLISHER)
            or user_has_role(request.user, Roles.REVIEWER)
        )


class IsContentEditorRole(BasePermission):
    """Allows access to anyone with at least Content Editor privileges."""

    def has_permission(self, request, view):
        return (
            user_has_role(request.user, Roles.ADMIN)
            or user_has_role(request.user, Roles.PUBLISHER)
            or user_has_role(request.user, Roles.REVIEWER)
            or user_has_role(request.user, Roles.CONTENT_EDITOR)
        )
