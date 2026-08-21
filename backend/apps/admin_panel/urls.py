from django.urls import path
from apps.admin_panel.views import (
    AdminOverviewStatsView,
    AdminAIUsageStatsView,
    AdminUserListView,
    AdminUserToggleActiveView,
    AdminSettingsView
)

urlpatterns = [
    path('admin/stats/overview/', AdminOverviewStatsView.as_view(), name='admin-overview'),
    path('admin/ai-usage/', AdminAIUsageStatsView.as_view(), name='admin-ai-usage'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/toggle/', AdminUserToggleActiveView.as_view(), name='admin-user-toggle'),
    path('admin/settings/', AdminSettingsView.as_view(), name='admin-settings'),
]
