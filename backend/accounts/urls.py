"""URL routes for authentication and user management."""

from django.urls import path

from . import views

urlpatterns = [
    # Auth (as documented in the report)
    path("auth/register/", views.RegisterView.as_view(), name="auth-register"),
    path("auth/login/", views.LoginView.as_view(), name="auth-login"),
    path("auth/logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("auth/profile/", views.ProfileView.as_view(), name="auth-profile"),
    # Admin user management
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/staff/", views.StaffCreateView.as_view(), name="staff-create"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user-detail"),
]
