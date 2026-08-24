"""Queue engine API views.

Student endpoints:
    GET    /api/departments/                    - browse departments + live stats
    POST   /api/departments/<id>/join/          - join today's queue (get a ticket)
    GET    /api/tickets/                        - my ticket history
    GET    /api/tickets/active/                 - my current active ticket (poll this)
    POST   /api/tickets/<id>/cancel/            - leave the queue

Staff endpoints (bound to their department):
    GET    /api/staff/queue/                    - today's queue snapshot + waiting list
    POST   /api/staff/call-next/                - call the next waiting ticket
    POST   /api/staff/tickets/<id>/start/       - student arrived, start serving
    POST   /api/staff/tickets/<id>/serve/       - mark ticket served (complete)
    POST   /api/staff/tickets/<id>/no-show/     - mark called ticket a no-show
    POST   /api/staff/queue/status/             - pause / resume / close the queue

Admin endpoints:
    POST/PATCH/DELETE /api/departments/...      - department CRUD
    GET    /api/reports/summary/                - daily operational report
"""

from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Department, Queue, Ticket
from .permissions import IsAdmin, IsAdminOrReadOnly, IsStaffMember, IsStudent
from .serializers import (
    DepartmentSerializer,
    JoinQueueSerializer,
    QueueSerializer,
    TicketSerializer,
)


# --------------------------------------------------------------------------- #
# Departments
# --------------------------------------------------------------------------- #


class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD for departments. Read: any user (including guests). Write: admin only."""

    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Department.objects.all()
        user_role = getattr(self.request.user, "role", None) if self.request.user and self.request.user.is_authenticated else None
        if user_role != "admin":
            queryset = queryset.filter(is_active=True)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: deactivate instead of removing historical data."""
        department = self.get_object()
        department.is_active = False
        department.save(update_fields=["is_active"])
        return Response(
            {"detail": f"Department '{department.name}' deactivated."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=JoinQueueSerializer, responses={201: TicketSerializer})
    @action(detail=True, methods=["post"], permission_classes=[IsStudent])
    def join(self, request, pk=None):
        """Student joins today's queue for this department."""
        department = self.get_object()

        if not department.is_active:
            return Response(
                {"detail": "This department is not currently taking a queue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queue = Queue.get_or_create_today(department)
        if queue.status != Queue.Status.OPEN:
            return Response(
                {"detail": f"The {department.name} queue is {queue.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # One active ticket per student across ALL departments.
        existing = Ticket.objects.filter(
            student=request.user, status__in=Ticket.ACTIVE_STATUSES
        ).first()
        if existing:
            return Response(
                {
                    "detail": (
                        "You already have an active ticket "
                        f"({existing.ticket_code} at {existing.queue.department.name}). "
                        "Cancel it before joining another queue."
                    ),
                    "active_ticket": TicketSerializer(existing).data,
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = JoinQueueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket = queue.issue_ticket(request.user)
        if serializer.validated_data.get("note"):
            ticket.note = serializer.validated_data["note"]
            ticket.save(update_fields=["note"])

        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


# --------------------------------------------------------------------------- #
# Student tickets
# --------------------------------------------------------------------------- #


class MyTicketsView(APIView):
    """GET /api/tickets/ - the caller's ticket history (newest first)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: TicketSerializer(many=True)})
    def get(self, request):
        tickets = Ticket.objects.filter(student=request.user).order_by("-created_at")[
            :50
        ]
        return Response(TicketSerializer(tickets, many=True).data)


class MyActiveTicketView(APIView):
    """GET /api/tickets/active/ - live status of the caller's active ticket."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: TicketSerializer})
    def get(self, request):
        ticket = (
            Ticket.objects.filter(
                student=request.user, status__in=Ticket.ACTIVE_STATUSES
            )
            .select_related("queue__department")
            .first()
        )
        if ticket is None:
            return Response(
                {"detail": "No active ticket."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(TicketSerializer(ticket).data)


class CancelTicketView(APIView):
    """POST /api/tickets/<id>/cancel/ - student leaves the queue."""

    permission_classes = [IsStudent]

    @extend_schema(responses={200: TicketSerializer})
    def post(self, request, pk):
        try:
            ticket = Ticket.objects.get(pk=pk, student=request.user)
        except Ticket.DoesNotExist:
            return Response(
                {"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if ticket.status not in Ticket.ACTIVE_STATUSES:
            return Response(
                {"detail": f"Ticket is already {ticket.get_status_display().lower()}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = Ticket.Status.CANCELLED
        ticket.closed_at = timezone.now()
        ticket.save(update_fields=["status", "closed_at"])
        return Response(TicketSerializer(ticket).data)


# --------------------------------------------------------------------------- #
# Staff counter operations
# --------------------------------------------------------------------------- #


def _staff_queue_or_error(user):
    """Resolve today's queue for a staff member's department."""
    if user.department is None:
        return None, Response(
            {"detail": "Your account is not assigned to a department."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Queue.get_or_create_today(user.department), None


class StaffQueueView(APIView):
    """GET /api/staff/queue/ - snapshot of today's queue for my department."""

    permission_classes = [IsStaffMember]

    @extend_schema(responses={200: dict})
    def get(self, request):
        queue, error = _staff_queue_or_error(request.user)
        if error:
            return error

        waiting = queue.waiting_tickets()
        now_serving = queue.now_serving

        return Response({
            "department": {
                "id": queue.department.id,
                "name": queue.department.name,
                "code": queue.department.code,
                "is_open": queue.department.is_open if hasattr(queue.department, 'is_open') else (queue.status == "open"),
                "avg_wait": queue.average_service_minutes() or 0,
            },
            "waiting_list": TicketSerializer(waiting, many=True).data,
            "now_serving": TicketSerializer(now_serving).data if now_serving else None,
        })


class CallNextView(APIView):
    """POST /api/staff/call-next/ - call the next waiting ticket."""

    permission_classes = [IsStaffMember]

    @extend_schema(responses={200: TicketSerializer})
    def post(self, request):
        queue, error = _staff_queue_or_error(request.user)
        if error:
            return error

        if queue.status == Queue.Status.CLOSED:
            return Response(
                {"detail": "The queue is closed."}, status=status.HTTP_400_BAD_REQUEST
            )

        current = queue.now_serving
        if current is not None:
            return Response(
                {
                    "detail": (
                        f"Ticket {current.ticket_code} is still "
                        f"{current.get_status_display().lower()}. "
                        "Complete it (serve / no-show) before calling the next one."
                    ),
                    "current_ticket": TicketSerializer(current).data,
                },
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            next_ticket = (
                Ticket.objects.select_for_update()
                .filter(queue=queue, status=Ticket.Status.WAITING)
                .order_by("number")
                .first()
            )
            if next_ticket is None:
                return Response(
                    {"detail": "The queue is empty - no students are waiting."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            next_ticket.status = Ticket.Status.CALLED
            next_ticket.called_at = timezone.now()
            next_ticket.served_by = request.user
            next_ticket.save(update_fields=["status", "called_at", "served_by"])

        return Response(TicketSerializer(next_ticket).data)


class _StaffTicketActionView(APIView):
    """Shared plumbing for staff actions on a specific ticket."""

    permission_classes = [IsStaffMember]

    def get_ticket(self, request, pk):
        if request.user.department is None:
            return None, Response(
                {"detail": "Your account is not assigned to a department."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            ticket = Ticket.objects.select_related("queue__department").get(pk=pk)
        except Ticket.DoesNotExist:
            return None, Response(
                {"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if ticket.queue.department_id != request.user.department_id:
            return None, Response(
                {"detail": "This ticket belongs to another department."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return ticket, None


class StartServingView(_StaffTicketActionView):
    """POST /api/staff/tickets/<id>/start/ - student arrived at counter."""

    @extend_schema(responses={200: TicketSerializer})
    def post(self, request, pk):
        ticket, error = self.get_ticket(request, pk)
        if error:
            return error
        if ticket.status != Ticket.Status.CALLED:
            return Response(
                {"detail": f"Cannot start serving a ticket that is {ticket.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ticket.status = Ticket.Status.SERVING
        ticket.serving_started_at = timezone.now()
        ticket.save(update_fields=["status", "serving_started_at"])
        return Response(TicketSerializer(ticket).data)


class ServeTicketView(_StaffTicketActionView):
    """POST /api/staff/tickets/<id>/serve/ - service completed."""

    @extend_schema(responses={200: TicketSerializer})
    def post(self, request, pk):
        ticket, error = self.get_ticket(request, pk)
        if error:
            return error
        if ticket.status not in [Ticket.Status.CALLED, Ticket.Status.SERVING]:
            return Response(
                {"detail": f"Cannot serve a ticket that is {ticket.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        if ticket.serving_started_at is None:
            ticket.serving_started_at = ticket.called_at or now
        ticket.status = Ticket.Status.SERVED
        ticket.served_at = now
        ticket.closed_at = now
        ticket.save(
            update_fields=["status", "serving_started_at", "served_at", "closed_at"]
        )
        return Response(TicketSerializer(ticket).data)


class NoShowView(_StaffTicketActionView):
    """POST /api/staff/tickets/<id>/no-show/ - called student never arrived."""

    @extend_schema(responses={200: TicketSerializer})
    def post(self, request, pk):
        ticket, error = self.get_ticket(request, pk)
        if error:
            return error
        if ticket.status != Ticket.Status.CALLED:
            return Response(
                {"detail": "Only a called ticket can be marked as a no-show."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ticket.status = Ticket.Status.NO_SHOW
        ticket.closed_at = timezone.now()
        ticket.save(update_fields=["status", "closed_at"])
        return Response(TicketSerializer(ticket).data)


class QueueStatusView(APIView):
    """POST /api/staff/queue/status/ - pause, resume or close today's queue."""

    permission_classes = [IsStaffMember]
    serializer_class = QueueSerializer

    @extend_schema(request=QueueSerializer, responses={200: QueueSerializer})
    def post(self, request):
        queue, error = _staff_queue_or_error(request.user)
        if error:
            return error

        new_status = request.data.get("status")
        if new_status not in Queue.Status.values:
            return Response(
                {"detail": f"Invalid status. Choose from {Queue.Status.values}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queue.status = new_status
        queue.save(update_fields=["status"])
        return Response(QueueSerializer(queue).data)


# --------------------------------------------------------------------------- #
# Admin reports
# --------------------------------------------------------------------------- #


class ReportSummaryView(APIView):
    """GET /api/reports/summary/?date=YYYY-MM-DD - per-department daily report."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: dict})
    def get(self, request):
        date_str = request.query_params.get("date")
        if date_str:
            from datetime import datetime

            try:
                report_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"detail": "Invalid date. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            report_date = timezone.localdate()

        departments = Department.objects.all()
        rows = []
        for department in departments:
            queue = department.queues.filter(service_date=report_date).first()
            if queue is None:
                rows.append({
                    "department_name": department.name,
                    "department_code": department.code,
                    "tickets_issued": 0,
                    "tickets_served": 0,
                    "no_shows": 0,
                    "tickets_cancelled": 0,
                    "still_waiting": 0,
                    "avg_service_minutes": None,
                    "avg_wait_minutes": None,
                })
                continue

            tickets = queue.tickets.all()
            served = tickets.filter(status=Ticket.Status.SERVED)

            wait_minutes = [
                (t.called_at - t.created_at).total_seconds() / 60.0
                for t in tickets
                if t.called_at is not None
            ]
            avg_wait = round(sum(wait_minutes) / len(wait_minutes), 2) if wait_minutes else None

            rows.append({
                "department_name": department.name,
                "department_code": department.code,
                "tickets_issued": tickets.count(),
                "tickets_served": served.count(),
                "no_shows": tickets.filter(status=Ticket.Status.NO_SHOW).count(),
                "tickets_cancelled": tickets.filter(status=Ticket.Status.CANCELLED).count(),
                "still_waiting": tickets.filter(status=Ticket.Status.WAITING).count(),
                "avg_service_minutes": queue.average_service_minutes() if served.exists() else None,
                "avg_wait_minutes": avg_wait,
            })

        totals = {
            "tickets_issued": sum(r["tickets_issued"] for r in rows),
            "tickets_served": sum(r["tickets_served"] for r in rows),
            "no_shows": sum(r["no_shows"] for r in rows),
            "tickets_cancelled": sum(r["tickets_cancelled"] for r in rows),
            "still_waiting": sum(r["still_waiting"] for r in rows),
        }

        return Response(
            {"date": str(report_date), "departments": rows, "totals": totals}
        )
