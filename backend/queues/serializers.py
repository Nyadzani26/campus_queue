"""Serializers for departments, queues and tickets."""

from rest_framework import serializers

from .models import Department, Queue, Ticket


class DepartmentSerializer(serializers.ModelSerializer):
    """Department with live queue statistics for today."""

    waiting_count = serializers.SerializerMethodField()
    now_serving = serializers.SerializerMethodField()
    estimated_wait_minutes = serializers.SerializerMethodField()
    queue_status = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "code",
            "description",
            "location",
            "is_active",
            "opens_at",
            "closes_at",
            "avg_service_minutes",
            "waiting_count",
            "now_serving",
            "estimated_wait_minutes",
            "queue_status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_code(self, value):
        value = value.strip().upper()
        if not value.isalnum():
            raise serializers.ValidationError(
                "Code must contain only letters and digits."
            )
        return value

    # -- live stats ----------------------------------------------------- #

    def _today_queue(self, obj) -> Queue | None:
        from django.utils import timezone

        return obj.queues.filter(service_date=timezone.localdate()).first()

    def get_waiting_count(self, obj) -> int:
        queue = self._today_queue(obj)
        return queue.waiting_count if queue else 0

    def get_now_serving(self, obj) -> str | None:
        queue = self._today_queue(obj)
        current = queue.now_serving if queue else None
        return current.ticket_code if current else None

    def get_estimated_wait_minutes(self, obj) -> float:
        queue = self._today_queue(obj)
        if not queue:
            return 0.0
        return round(queue.waiting_count * queue.average_service_minutes(), 1)

    def get_queue_status(self, obj) -> str:
        queue = self._today_queue(obj)
        return queue.status if queue else Queue.Status.OPEN


class TicketSerializer(serializers.ModelSerializer):
    """Full ticket representation including live position and estimates."""

    ticket_code = serializers.CharField(read_only=True)
    position = serializers.IntegerField(read_only=True)
    estimated_wait_minutes = serializers.FloatField(read_only=True)
    department = serializers.CharField(source="queue.department.name", read_only=True)
    department_code = serializers.CharField(
        source="queue.department.code", read_only=True
    )
    student_username = serializers.CharField(source="student.username", read_only=True)
    student_name = serializers.SerializerMethodField()
    student_number = serializers.CharField(
        source="student.student_number", read_only=True
    )
    served_by_username = serializers.CharField(
        source="served_by.username", read_only=True, default=None
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    # ====== NEW FIELDS FOR FRONTEND COMPATIBILITY ======
    customer_name = serializers.SerializerMethodField()
    customer_username = serializers.CharField(source="student.username", read_only=True)
    estimated_wait = serializers.FloatField(source="estimated_wait_minutes", read_only=True)
    # ===================================================

    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_code",
            "number",
            "status",
            "status_display",
            "position",
            "estimated_wait_minutes",
            "department",
            "department_code",
            "student_username",
            "student_name",
            "student_number",
            "served_by_username",
            "note",
            "created_at",
            "called_at",
            "serving_started_at",
            "served_at",
            "closed_at",
            # New fields added here
            "customer_name",
            "customer_username",
            "estimated_wait",
        ]
        read_only_fields = fields

    def get_student_name(self, obj) -> str:
        full = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return full or obj.student.username

    # ====== NEW METHOD FOR customer_name ======
    def get_customer_name(self, obj) -> str:
        return self.get_student_name(obj)  # same as student_name


class JoinQueueSerializer(serializers.Serializer):
    """Input for a student joining a department's queue."""

    note = serializers.CharField(max_length=255, required=False, allow_blank=True)


class QueueSerializer(serializers.ModelSerializer):
    """Queue snapshot used by the staff dashboard."""

    department_name = serializers.CharField(source="department.name", read_only=True)
    department_code = serializers.CharField(source="department.code", read_only=True)
    waiting_count = serializers.IntegerField(read_only=True)
    average_service_minutes = serializers.SerializerMethodField()
    now_serving = serializers.SerializerMethodField()

    class Meta:
        model = Queue
        fields = [
            "id",
            "department",
            "department_name",
            "department_code",
            "service_date",
            "status",
            "last_ticket_number",
            "waiting_count",
            "average_service_minutes",
            "now_serving",
        ]
        read_only_fields = fields

    def get_average_service_minutes(self, obj) -> float:
        return obj.average_service_minutes()

    def get_now_serving(self, obj):
        current = obj.now_serving
        return TicketSerializer(current).data if current else None