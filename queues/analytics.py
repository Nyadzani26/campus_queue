"""
Advanced analytics models for queue performance tracking.
These models are defined but not yet migrated — they can be activated in a future release.
"""

from django.db import models
from django.utils import timezone
from datetime import timedelta, date
from .models import Queue, Ticket, Department


class QueueAnalytics(models.Model):
    """Hourly queue performance metrics."""

    queue = models.ForeignKey(Queue, on_delete=models.CASCADE, related_name='analytics')
    hour = models.DateTimeField(db_index=True)

    # Ticket metrics
    tickets_issued = models.IntegerField(default=0)
    tickets_served = models.IntegerField(default=0)
    tickets_cancelled = models.IntegerField(default=0)
    no_shows = models.IntegerField(default=0)

    # Wait time metrics
    avg_wait_time_minutes = models.FloatField(null=True, blank=True)
    median_wait_time_minutes = models.FloatField(null=True, blank=True)
    max_wait_time_minutes = models.FloatField(null=True, blank=True)

    # Service time metrics
    avg_service_time_minutes = models.FloatField(null=True, blank=True)
    median_service_time_minutes = models.FloatField(null=True, blank=True)

    # Queue health
    peak_queue_length = models.IntegerField(default=0)
    queue_efficiency = models.FloatField(null=True, blank=True)  # 0–100 %

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-hour']
        indexes = [
            models.Index(fields=['queue', 'hour']),
        ]

    def __str__(self):
        return f"{self.queue.department.name} - {self.hour.strftime('%Y-%m-%d %H:00')}"


class DepartmentReport(models.Model):
    """Daily aggregated department statistics."""

    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='daily_reports')
    report_date = models.DateField(db_index=True)

    # Basic metrics
    total_tickets_issued = models.IntegerField(default=0)
    total_tickets_served = models.IntegerField(default=0)
    total_no_shows = models.IntegerField(default=0)
    total_cancelled = models.IntegerField(default=0)

    # Performance metrics
    avg_wait_time = models.FloatField(null=True, blank=True)
    avg_service_time = models.FloatField(null=True, blank=True)
    total_service_hours = models.FloatField(null=True, blank=True)

    # Efficiency metrics
    service_completion_rate = models.FloatField(null=True, blank=True)
    no_show_rate = models.FloatField(null=True, blank=True)

    # Peak hours
    peak_hour = models.IntegerField(null=True, blank=True)  # 0–23
    peak_queue_length = models.IntegerField(default=0)

    # Staffing metrics
    total_staff_hours = models.FloatField(default=0)
    tickets_per_staff_hour = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-report_date']
        unique_together = ['department', 'report_date']
        indexes = [
            models.Index(fields=['department', 'report_date']),
        ]

    def __str__(self):
        return f"{self.department.name} - {self.report_date}"


class StudentJourneyMetrics(models.Model):
    """Track student experience and traffic patterns."""

    PEAK_TIMES = (
        ('morning', 'Morning (8–11 AM)'),
        ('midday', 'Midday (11 AM – 2 PM)'),
        ('afternoon', 'Afternoon (2–5 PM)'),
    )

    report_date = models.DateField(db_index=True)
    peak_time = models.CharField(max_length=10, choices=PEAK_TIMES)

    avg_wait_time_minutes = models.FloatField()
    avg_tickets_waiting = models.FloatField()
    estimated_student_satisfaction = models.FloatField(null=True, blank=True)  # 1–5 scale

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-report_date']
        unique_together = ['report_date', 'peak_time']


class QueuePrediction(models.Model):
    """Predictive staffing recommendations based on historical queue data."""

    queue = models.ForeignKey(Queue, on_delete=models.CASCADE, related_name='predictions')
    predicted_date = models.DateField()
    predicted_hour = models.IntegerField()  # 0–23

    # Predictions
    expected_tickets = models.IntegerField()
    expected_peak_queue_length = models.IntegerField()
    expected_avg_wait_minutes = models.FloatField()

    # Recommendations
    recommended_staff = models.IntegerField()
    confidence_score = models.FloatField()  # 0–100 %

    # Actual vs Predicted (filled in after the fact)
    actual_tickets = models.IntegerField(null=True, blank=True)
    actual_peak_queue_length = models.IntegerField(null=True, blank=True)
    actual_avg_wait_minutes = models.FloatField(null=True, blank=True)
    prediction_accuracy = models.FloatField(null=True, blank=True)  # %

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-predicted_date', 'predicted_hour']
        unique_together = ['queue', 'predicted_date', 'predicted_hour']


class NotificationLog(models.Model):
    """Track all system notifications sent to users."""

    NOTIFICATION_TYPES = (
        ('ticket_called', 'Ticket Called'),
        ('estimated_wait', 'Estimated Wait Updated'),
        ('position_changed', 'Position Changed'),
        ('queue_status_change', 'Queue Status Changed'),
        ('staff_alert', 'Staff Alert'),
        ('system_maintenance', 'System Maintenance'),
    )

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]

    recipient_id = models.IntegerField()  # User ID
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    subject = models.CharField(max_length=255)
    message = models.TextField()

    # Delivery channels
    sent_via_email = models.BooleanField(default=False)
    sent_via_sms = models.BooleanField(default=False)
    sent_via_push = models.BooleanField(default=False)
    sent_via_websocket = models.BooleanField(default=True)

    email_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sms_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient_id', 'created_at']),
        ]

    def __str__(self):
        return f"{self.get_notification_type_display()} — {self.subject}"
