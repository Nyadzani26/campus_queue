"""Role-based permission classes for the SmartQueue API."""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import User


class IsStudent(BasePermission):
    message = "Only students may perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.STUDENT
        )


class IsStaffMember(BasePermission):
    message = "Only staff members may perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.STAFF
        )


class IsAdmin(BasePermission):
    message = "Only administrators may perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class IsAdminOrReadOnly(BasePermission):
    """Anyone authenticated can read; only admins can write."""

    message = "Only administrators may modify this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == User.Role.ADMIN
