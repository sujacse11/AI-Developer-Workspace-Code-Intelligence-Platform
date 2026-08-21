from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from apps.collaboration.models import ProjectMember, LineComment
from apps.collaboration.serializers import ProjectMemberSerializer, LineCommentSerializer
from apps.projects.models import Project, ProjectFile
from apps.ai.models import AIActionResult
from apps.ai.serializers import AIActionResultSerializer

User = get_user_model()

class ProjectMemberListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectMemberSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return ProjectMember.objects.filter(project_id=project_id)

    def create(self, request, *args, **kwargs):
        project_id = self.kwargs.get('project_id')
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({'error': 'Only project owner can invite members'}, status=status.HTTP_403_FORBIDDEN)

        target_identifier = request.data.get('username_or_email')
        role = request.data.get('role', 'editor')

        try:
            target_user = User.objects.get(username=target_identifier) if '@' not in target_identifier else User.objects.get(email=target_identifier)
        except User.DoesNotExist:
            return Response({'error': f'User "{target_identifier}" not found'}, status=status.HTTP_404_NOT_FOUND)

        member, created = ProjectMember.objects.get_or_create(
            project=project,
            user=target_user,
            defaults={'role': role}
        )
        if not created:
            member.role = role
            member.save()

        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class LineCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = LineCommentSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        file_id = self.kwargs.get('file_id')
        return LineComment.objects.filter(file_id=file_id)

    def perform_create(self, serializer):
        file_id = self.kwargs.get('file_id')
        pfile = ProjectFile.objects.get(id=file_id)
        serializer.save(author=self.request.user, file=pfile)

class CombinedReviewHistoryView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        ai_reviews = AIActionResult.objects.filter(project=project).order_by('-created_at')[:20]
        comments = LineComment.objects.filter(file__project=project).order_by('-created_at')[:30]

        return Response({
            'project_id': project.id,
            'project_name': project.name,
            'ai_reviews': AIActionResultSerializer(ai_reviews, many=True).data,
            'line_comments': LineCommentSerializer(comments, many=True).data
        })
