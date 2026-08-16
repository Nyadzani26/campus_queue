"""
URL configuration for SPU SmartQueue.
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """API root — returns system info and available endpoint groups."""
    return Response({
        'system': 'SPU SmartQueue',
        'version': '1.0.0',
        'institution': 'Sol Plaatje University',
        'endpoints': {
            'auth': '/api/auth/',
            'departments': '/api/departments/',
            'tickets': '/api/tickets/',
            'staff': '/api/staff/',
            'reports': '/api/reports/',
            'users': '/api/users/',
        },
    })


from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Interactive Swagger UI for testing APIs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # REST API
    path('api/', include('accounts.urls')),
    path('api/', include('queues.urls')),
    path('api/', api_root, name='api-root'),

    # Frontend SPA
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]
