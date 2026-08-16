"""Serializers for authentication and user management."""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from queues.models import Department
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of a user profile."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)
    department_name = serializers.CharField(
        source="department.name", read_only=True, default=None
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "student_number",
            "phone",
            "department",
            "department_name",
            "date_joined",
        ]
        read_only_fields = ["id", "role", "date_joined", "department"]


class RegisterSerializer(serializers.ModelSerializer):
    """Public self-registration. Always creates a STUDENT account.
    Staff and admin accounts are created by an administrator via Django admin."""

    password = serializers.CharField(
        write_only=True, validators=[validate_password], style={"input_type": "password"}
    )
    # Declare these explicitly so DRF doesn't inherit model default="" and
    # conflict with our required=True validation.
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    student_number = serializers.CharField(required=True, max_length=20)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20, default="")

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "student_number",
            "phone",
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_student_number(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Student number is required.")
        if User.objects.filter(student_number=value).exists():
            raise serializers.ValidationError(
                "An account with this student number already exists."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(role=User.Role.STUDENT, **validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Validates credentials and resolves the authenticated user."""

    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["username"],
            password=attrs["password"],
        )
        if user is None:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        attrs["user"] = user
        return attrs


class StaffCreateSerializer(serializers.ModelSerializer):
    """Admin-only creation of staff accounts bound to a department."""

    password = serializers.CharField(
        write_only=True, validators=[validate_password], style={"input_type": "password"}
    )
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "department",
        ]
        extra_kwargs = {"email": {"required": True}}

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(role=User.Role.STAFF, **validated_data)
        user.set_password(password)
        user.save()
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Fields a user may update on their own profile."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone"]
