from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from apps.users.views import (
    RegisterView,
    CustomTokenObtainPairView,
    UserProfileView,
    UserActivityLogListView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    DashboardView
)

urlpatterns = [
    path('users/register/', RegisterView.as_view(), name='user-register'),
    path('users/login/', CustomTokenObtainPairView.as_view(), name='user-login'),
    path('users/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('users/logout/', TokenBlacklistView.as_view(), name='token-logout'),
    path('users/me/', UserProfileView.as_view(), name='user-profile'),
    path('users/activity/', UserActivityLogListView.as_view(), name='user-activity'),
    path('users/password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('users/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
