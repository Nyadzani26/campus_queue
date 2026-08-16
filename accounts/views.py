"""Authentication and user-management API views.

Endpoints (as documented in the Group A report):
    POST   /api/auth/register/   - student self-registration
    POST   /api/auth/login/      - obtain auth token
    POST   /api/auth/logout/     - invalidate current token
    GET    /api/auth/profile/    - current user's profile
    PATCH  /api/auth/profile/    - update own profile

Admin-only user management:
    GET    /api/users/           - list users (filter by ?role=)
    POST   /api/users/staff/     - create a staff account
    PATCH  /api/users/<id>/      - activate/deactivate or change role
"""

from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from queues.permissions import IsAdmin
from .serializers import (
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    StaffCreateSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    """POST /api/auth/register/ - public student registration."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ - returns an auth token + profile."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class LogoutView(APIView):
    """POST /api/auth/logout/ - deletes the caller's token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "Logged out successfully."})


class ProfileView(APIView):
    """GET/PATCH /api/auth/profile/ - the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class UserListView(generics.ListAPIView):
    """GET /api/users/ - admin listing of all users, filterable by role."""

    permission_classes = [IsAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by("username")
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class StaffCreateView(APIView):
    """POST /api/users/staff/ - admin creates a staff account."""

    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    """GET/PATCH /api/users/<id>/ - admin manages a single account."""

    permission_classes = [IsAdmin]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if user is None:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        if user is None:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )

        allowed = {"is_active", "role", "department"}
        updates = {k: v for k, v in request.data.items() if k in allowed}
        if not updates:
            return Response(
                {"detail": f"No updatable fields supplied. Allowed: {sorted(allowed)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "role" in updates and updates["role"] not in User.Role.values:
            return Response(
                {"detail": f"Invalid role. Choose from {User.Role.values}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "department" in updates:
            from queues.models import Department

            dept_id = updates.pop("department")
            if dept_id is None:
                user.department = None
            else:
                try:
                    user.department = Department.objects.get(pk=dept_id)
                except Department.DoesNotExist:
                    return Response(
                        {"detail": "Department not found."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        for field, value in updates.items():
            setattr(user, field, value)
        user.save()
        return Response(UserSerializer(user).data)
