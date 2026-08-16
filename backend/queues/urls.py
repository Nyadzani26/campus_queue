"""URL routing for queue and department management."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "queues"

# Department ViewSet routing
router = DefaultRouter()
router.register(r"departments", views.DepartmentViewSet, basename="department")

urlpatterns = [
    # Department CRUD via ViewSet
    path("", include(router.urls)),
    # Student ticket endpoints
    path("tickets/", views.MyTicketsView.as_view(), name="my-tickets"),
    path("tickets/active/", views.MyActiveTicketView.as_view(), name="active-ticket"),
    path("tickets/<int:pk>/cancel/", views.CancelTicketView.as_view(), name="cancel-ticket"),
    # Staff counter operations
    path("staff/queue/", views.StaffQueueView.as_view(), name="staff-queue"),
    path("staff/call-next/", views.CallNextView.as_view(), name="call-next"),
    path("staff/tickets/<int:pk>/start/", views.StartServingView.as_view(), name="start-serving"),
    path("staff/tickets/<int:pk>/serve/", views.ServeTicketView.as_view(), name="serve-ticket"),
    path("staff/tickets/<int:pk>/no-show/", views.NoShowView.as_view(), name="no-show"),
    path("staff/queue/status/", views.QueueStatusView.as_view(), name="queue-status"),
    # Admin reports
    path("reports/summary/", views.ReportSummaryView.as_view(), name="report-summary"),
]
