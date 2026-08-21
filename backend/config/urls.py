from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # API endpoints version 1
    path('api/v1/', include('apps.users.urls')),
    path('api/v1/', include('apps.projects.urls')),
    path('api/v1/', include('apps.ai.urls')),
    path('api/v1/', include('apps.collaboration.urls')),
    path('api/v1/', include('apps.admin_panel.urls')),
]
