"""Custom user model with role-based access for SmartQueue.

Roles:
    STUDENT - joins queues remotely and tracks their position.
    STAFF   - operates a service counter for a department.
    ADMIN   - manages departments, staff accounts and reports.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        STAFF = "staff", "Staff"
        ADMIN = "admin", "Administrator"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT,
        db_index=True,
    )
    student_number = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="SPU student number (students only).",
    )
    phone = models.CharField(max_length=20, blank=True, default="")
    department = models.ForeignKey(
        "queues.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
        help_text="Department this staff member serves (staff only).",
    )

    @property
    def is_student(self) -> bool:
        return self.role == self.Role.STUDENT

    @property
    def is_staff_member(self) -> bool:
        return self.role == self.Role.STAFF

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    def __str__(self) -> str:
        return f"{self.username} ({self.get_role_display()})"
