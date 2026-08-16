from django.contrib import admin
from .models import Department, Queue, Ticket


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'location', 'opens_at', 'closes_at', 'avg_service_minutes', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'code', 'location')
    ordering = ('name',)


@admin.register(Queue)
class QueueAdmin(admin.ModelAdmin):
    list_display = ('department', 'service_date', 'status', 'last_ticket_number', 'created_at')
    list_filter = ('status', 'department', 'service_date')
    search_fields = ('department__name',)
    ordering = ('-service_date', 'department')
    date_hierarchy = 'service_date'


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_code', 'student', 'status', 'served_by', 'created_at', 'called_at', 'served_at')
    list_filter = ('status', 'queue__department', 'queue__service_date')
    search_fields = ('student__username', 'student__first_name', 'student__last_name', 'number')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'called_at', 'serving_started_at', 'served_at', 'closed_at')
