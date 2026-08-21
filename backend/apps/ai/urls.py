from django.urls import path
from apps.ai.views import AIExecuteView, AIJobDetailView, AIHistoryListView

urlpatterns = [
    path('ai/execute/', AIExecuteView.as_view(), name='ai-execute'),
    path('ai/jobs/<uuid:job_id>/', AIJobDetailView.as_view(), name='ai-job-detail'),
    path('ai/history/', AIHistoryListView.as_view(), name='ai-history'),
]
