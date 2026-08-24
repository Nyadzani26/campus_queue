"""Core domain models for SmartQueue.

Department -> has one active Queue per day -> Queue holds Tickets.
Ticket numbers are per-department daily counters, e.g. ICT-042.
"""

from datetime import date

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone

class Department(models.Model):
    """An SPU service department, e.g. ICT Helpdesk, Printing Room, Finance."""

    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(
        max_length=10,
        unique=True,
        help_text="Short code used in ticket numbers, e.g. ICT.",
    )
    description = models.TextField(blank=True, default="")
    location = models.CharField(max_length=150, blank=True, default="")
    is_active = models.BooleanField(default=True)
    opens_at = models.TimeField(default="08:00")
    closes_at = models.TimeField(default="16:30")
    avg_service_minutes = models.PositiveIntegerField(
        default=5,
        help_text="Fallback average service time when there is no history yet.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class Queue(models.Model):
    """A department's queue for a single service day."""

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        PAUSED = "paused", "Paused"
        CLOSED = "closed", "Closed"

    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="queues"
    )
    service_date = models.DateField(default=date.today)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.OPEN
    )
    last_ticket_number = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-service_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["department", "service_date"],
                name="one_queue_per_department_per_day",
            )
        ]

    def __str__(self) -> str:
        return f"{self.department.code} queue {self.service_date} ({self.status})"

    # ------------------------------------------------------------------ #
    # Queue statistics
    # ------------------------------------------------------------------ #

    def waiting_tickets(self):
        return self.tickets.filter(status=Ticket.Status.WAITING).order_by("number")

    @property
    def waiting_count(self) -> int:
        return self.waiting_tickets().count()

    @property
    def now_serving(self):
        """Ticket currently called or being served, if any."""
        return (
            self.tickets.filter(
                status__in=[Ticket.Status.CALLED, Ticket.Status.SERVING]
            )
            .order_by("-called_at")
            .first()
        )

    def average_service_minutes(self) -> float:
        """Average real service duration today, falling back to the
        department's configured estimate when no tickets are complete."""
        served = self.tickets.filter(
            status=Ticket.Status.SERVED,
            serving_started_at__isnull=False,
            served_at__isnull=False,
        )
        durations = [
            (t.served_at - t.serving_started_at).total_seconds() / 60.0
            for t in served
        ]
        if durations:
            return round(sum(durations) / len(durations), 2)
        return float(self.department.avg_service_minutes)

    # ------------------------------------------------------------------ #
    # Ticket issuing (atomic, race-safe)
    # ------------------------------------------------------------------ #

    def issue_ticket(self, student) -> "Ticket":
        """Issue the next ticket in this queue for a student, atomically."""
        with transaction.atomic():
            queue = Queue.objects.select_for_update().get(pk=self.pk)
            queue.last_ticket_number += 1
            queue.save(update_fields=["last_ticket_number"])
            return Ticket.objects.create(
                queue=queue,
                student=student,
                number=queue.last_ticket_number,
            )

    @classmethod
    def get_or_create_today(cls, department: Department) -> "Queue":
        queue, _ = cls.objects.get_or_create(
            department=department, service_date=timezone.localdate()
        )
        return queue


class Ticket(models.Model):
    """A student's place in a queue.

    Lifecycle: waiting -> called -> serving -> served
    Terminal alternatives: cancelled (by student), no_show (by staff).
    """

    class Status(models.TextChoices):
        WAITING = "waiting", "Waiting"
        CALLED = "called", "Called"
        SERVING = "serving", "Serving"
        SERVED = "served", "Served"
        CANCELLED = "cancelled", "Cancelled"
        NO_SHOW = "no_show", "No show"

    ACTIVE_STATUSES = [Status.WAITING, Status.CALLED, Status.SERVING]

    queue = models.ForeignKey(Queue, on_delete=models.CASCADE, related_name="tickets")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets"
    )
    number = models.PositiveIntegerField()
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.WAITING, db_index=True
    )
    note = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Optional reason for the visit provided by the student.",
    )
    served_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_served",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    called_at = models.DateTimeField(null=True, blank=True)
    serving_started_at = models.DateTimeField(null=True, blank=True)
    served_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["queue", "number"]
        constraints = [
            models.UniqueConstraint(
                fields=["queue", "number"], name="unique_ticket_number_per_queue"
            )
        ]

    @property
    def ticket_code(self) -> str:
        """Human-friendly ticket reference, e.g. ICT-042."""
        return f"{self.queue.department.code}-{self.number:03d}"

    @property
    def position(self) -> int | None:
        """1-based position among waiting tickets. None once no longer waiting."""
        if self.status != self.Status.WAITING:
            return None
        return (
            self.queue.tickets.filter(
                status=self.Status.WAITING, number__lt=self.number
            ).count()
            + 1
        )

    @property
    def estimated_wait_minutes(self) -> float | None:
        pos = self.position
        if pos is None:
            return None
        return round(pos * self.queue.average_service_minutes(), 1)

    def __str__(self) -> str:
        return f"{self.ticket_code} [{self.status}]"
