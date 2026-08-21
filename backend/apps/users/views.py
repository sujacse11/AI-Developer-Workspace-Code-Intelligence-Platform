from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from apps.users.models import ActivityLog
from apps.users.serializers import UserRegisterSerializer, UserProfileSerializer, ActivityLogSerializer

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
            action_type='user_registered',
            target_type='user',
            target_id=str(user.id),
            metadata={'username': user.username}
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

class DashboardView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        # Import related models inside method to avoid circular imports during startup
        from apps.projects.models import Project
        from apps.projects.serializers import ProjectSerializer
        from apps.ai.models import AIActionResult
        from apps.ai.serializers import AIActionResultSerializer

        saved_projects = Project.objects.filter(owner=user).order_by('-updated_at')[:10]
        recent_activities = ActivityLog.objects.filter(user=user).order_by('-created_at')[:10]
        recent_ai_reviews = AIActionResult.objects.filter(user=user).order_by('-created_at')[:10]

        total_projects = Project.objects.filter(owner=user).count()
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
                'avg_code_quality_score': avg_score
            },
            'recent_projects': ProjectSerializer(saved_projects, many=True).data,
            'recent_activities': ActivityLogSerializer(recent_activities, many=True).data,
            'recent_ai_reviews': AIActionResultSerializer(recent_ai_reviews, many=True).data
        })
