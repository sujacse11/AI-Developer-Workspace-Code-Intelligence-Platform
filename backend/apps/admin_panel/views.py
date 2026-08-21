from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum, Avg
from django.contrib.auth import get_user_model

from apps.admin_panel.models import SystemSetting, FeatureFlag
from apps.admin_panel.serializers import SystemSettingSerializer, FeatureFlagSerializer
from apps.projects.models import Project, ProjectFile
from apps.ai.models import AIJob, AIActionResult
from apps.users.serializers import UserProfileSerializer

User = get_user_model()

class IsAdminOrStaff(permissions.BasePermission):
    """Permission check ensuring user is authenticated staff or superuser."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)

class AdminOverviewStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrStaff)

    def get(self, request):
        total_users = User.objects.count()
        total_projects = Project.objects.count()
        total_files = ProjectFile.objects.count()
        total_ai_jobs = AIJob.objects.count()
        
        token_stats = AIJob.objects.aggregate(
            total_tokens=Sum('tokens_used'),
            completed_jobs=Count('job_id', filter=models.Q(status='completed')),
            failed_jobs=Count('job_id', filter=models.Q(status='failed'))
        ) if hasattr(models, 'Q') else {
            'total_tokens': AIJob.objects.aggregate(Sum('tokens_used'))['tokens_used__sum'] or 0,
            'completed_jobs': AIJob.objects.filter(status='completed').count(),
            'failed_jobs': AIJob.objects.filter(status='failed').count(),
        }

        total_tokens = token_stats.get('total_tokens') or 0
        cost_estimate = round((total_tokens / 1000) * 0.003, 4)

        avg_score = AIActionResult.objects.filter(score__isnull=False).aggregate(Avg('score'))['score__avg'] or 0

        return Response({
            'overview': {
                'total_users': total_users,
                'total_projects': total_projects,
                'total_files': total_files,
                'total_ai_jobs': total_ai_jobs,
                'completed_jobs': token_stats.get('completed_jobs', 0),
                'failed_jobs': token_stats.get('failed_jobs', 0),
                'total_tokens_consumed': total_tokens,
                'estimated_cost_usd': cost_estimate,
                'average_code_quality_score': round(avg_score, 1)
            }
        })

from django.db import models

class AdminAIUsageStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrStaff)

    def get(self, request):
        # Queryset aggregation per feature action type
        feature_breakdown = AIJob.objects.values('action_type').annotate(
            request_count=Count('job_id'),
            total_tokens=Sum('tokens_used'),
            avg_tokens=Avg('tokens_used')
        ).order_by('-request_count')

        formatted_features = []
        for item in feature_breakdown:
            tokens = item['total_tokens'] or 0
            formatted_features.append({
                'action_type': item['action_type'],
                'request_count': item['request_count'],
                'total_tokens': tokens,
                'estimated_cost_usd': round((tokens / 1000) * 0.003, 4)
            })

        # Quality score breakdown per feature
        quality_breakdown = AIActionResult.objects.filter(score__isnull=False).values('action_type').annotate(
            avg_score=Avg('score'),
            sample_size=Count('id')
        ).order_by('-avg_score')

        return Response({
            'feature_usage': formatted_features,
            'quality_scores': quality_breakdown
        })

class AdminUserListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrStaff)
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')

class AdminUserToggleActiveView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrStaff)

    def patch(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        target_user.is_active = not target_user.is_active
        target_user.save()

        return Response({
            'message': f"User '{target_user.username}' is now {'active' if target_user.is_active else 'deactivated'}.",
            'user': UserProfileSerializer(target_user).data
        })

class AdminSettingsView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrStaff)

    def get(self, request):
        settings = SystemSetting.objects.all()
        flags = FeatureFlag.objects.all()
        return Response({
            'settings': SystemSettingSerializer(settings, many=True).data,
            'feature_flags': FeatureFlagSerializer(flags, many=True).data,
            'active_model': 'Claude 3.5 Sonnet (Production)',
            'available_models': ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro', 'DeepSeek R1']
        })

    def patch(self, request):
        key = request.data.get('key')
        value = request.data.get('value')
        if key and value is not None:
            setting, _ = SystemSetting.objects.update_or_create(
                key=key,
                defaults={'value': value}
            )
            return Response(SystemSettingSerializer(setting).data)
        
        flag_name = request.data.get('feature_name')
        if flag_name:
            is_enabled = request.data.get('is_enabled', True)
            flag, _ = FeatureFlag.objects.update_or_create(
                feature_name=flag_name,
                defaults={'is_enabled': is_enabled}
            )
            return Response(FeatureFlagSerializer(flag).data)

        return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
