import uuid
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

from apps.users.models import ActivityLog
from apps.users.serializers import (
    UserRegisterSerializer,
    UserProfileSerializer,
    ActivityLogSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        ActivityLog.objects.create(
            user=user,
            action_type='user_registered_kyc_verified',
            target_type='user',
            target_id=str(user.id),
            metadata={'username': user.username, 'kyc_verified': user.kyc_verified}
        )
        return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class UserActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user)[:50]

class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        user = User.objects.get(email__iexact=email)
        reset_token = str(uuid.uuid4())
        user.reset_password_token = reset_token
        user.reset_password_expires = timezone.now() + timedelta(hours=1)
        user.save()

        ActivityLog.objects.create(
            user=user,
            action_type='password_reset_requested',
            target_type='user',
            target_id=str(user.id),
            metadata={'email': email}
        )

        return Response({
            'message': 'Password reset token generated successfully.',
            'reset_token': reset_token,
            'expires_in': '1 hour'
        }, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(reset_password_token=token)
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired password reset token.'}, status=status.HTTP_400_BAD_REQUEST)

        if user.reset_password_expires and timezone.now() > user.reset_password_expires:
            return Response({'error': 'Password reset token has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.reset_password_token = None
        user.reset_password_expires = None
        user.save()

        ActivityLog.objects.create(
            user=user,
            action_type='password_reset_completed',
            target_type='user',
            target_id=str(user.id),
            metadata={'username': user.username}
        )

        return Response({'message': 'Password has been reset successfully. You can now log in with your new password.'}, status=status.HTTP_200_OK)

class DashboardView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        from apps.projects.models import Project
        from apps.projects.serializers import ProjectSerializer
        from apps.ai.models import AIActionResult
        from apps.ai.serializers import AIActionResultSerializer
        from django.db.models import Q

        if user.is_staff or user.is_superuser:
            saved_projects = Project.objects.all().order_by('-updated_at')[:15]
            total_projects = Project.objects.count()
            recent_activities = ActivityLog.objects.all().order_by('-created_at')[:10]
            recent_ai_reviews = AIActionResult.objects.all().order_by('-created_at')[:10]
            total_ai_runs = AIActionResult.objects.count()
        else:
            saved_projects = Project.objects.filter(Q(owner=user) | Q(members__user=user)).distinct().order_by('-updated_at')[:10]
            total_projects = saved_projects.count()
            recent_activities = ActivityLog.objects.filter(user=user).order_by('-created_at')[:10]
            recent_ai_reviews = AIActionResult.objects.filter(user=user).order_by('-created_at')[:10]
            total_ai_runs = AIActionResult.objects.filter(user=user).count()

        avg_score = 0
        scores = [r.score for r in recent_ai_reviews if r.score is not None]
        if scores:
            avg_score = round(sum(scores) / len(scores), 1)

        return Response({
            'user': UserProfileSerializer(user).data,
            'stats': {
                'total_projects': total_projects,
                'total_ai_runs': total_ai_runs,
                'avg_code_quality_score': avg_score,
                'is_admin_view': bool(user.is_staff or user.is_superuser)
            },
            'recent_projects': ProjectSerializer(saved_projects, many=True).data,
            'recent_activities': ActivityLogSerializer(recent_activities, many=True).data,
            'recent_ai_reviews': AIActionResultSerializer(recent_ai_reviews, many=True).data
        })
