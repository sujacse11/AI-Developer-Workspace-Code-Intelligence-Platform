import io
import zipfile
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction

from apps.projects.models import Project, ProjectFile, FileVersion
from apps.projects.serializers import ProjectSerializer, ProjectFileSerializer, FileVersionSerializer
from apps.users.models import ActivityLog

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        # Owned projects + shared member projects
        return Project.objects.filter(owner=user).distinct()

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        # Create default initial file for quick start
        initial_file = ProjectFile.objects.create(
            project=project,
            path='main.py' if project.language_stack == 'python' else 'index.js',
            language=project.language_stack,
            current_content='# Welcome to AI Developer Workspace\n\ndef main():\n    print("Hello, world!")\n\nif __name__ == "__main__":\n    main()\n' if project.language_stack == 'python' else '// Welcome to AI Developer Workspace\n\nfunction main() {\n  console.log("Hello, world!");\n}\n\nmain();\n'
        )
        FileVersion.objects.create(
            file=initial_file,
            content=initial_file.current_content,
            author=self.request.user,
            commit_message='Initial boilerplate file creation'
        )
        ActivityLog.objects.create(
            user=self.request.user,
            action_type='project_created',
            target_type='project',
            target_id=str(project.id),
            metadata={'name': project.name}
        )

    @action(detail=True, methods=['post'], url_path='files')
    def create_file(self, request, pk=None):
        project = self.get_object()
        path = request.data.get('path', '').strip()
        language = request.data.get('language', 'python')
        content = request.data.get('content', '')

        if not path:
            return Response({'error': 'Path is required'}, status=status.HTTP_400_BAD_REQUEST)

        if ProjectFile.objects.filter(project=project, path=path).exists():
            return Response({'error': f'File at path "{path}" already exists'}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = ProjectFile.objects.create(
            project=project,
            path=path,
            language=language,
            current_content=content
        )
        FileVersion.objects.create(
            file=file_obj,
            content=content,
            author=request.user,
            commit_message=f'Created file {path}'
        )

        return Response(ProjectFileSerializer(file_obj).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='upload')
    def upload_zip(self, request, pk=None):
        project = self.get_object()
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        created_files = []
        try:
            with zipfile.ZipFile(uploaded_file, 'r') as zip_ref:
                for file_info in zip_ref.infolist():
                    if file_info.is_dir():
                        continue
                    
                    filename = file_info.filename
                    # Ignore junk hidden files
                    if filename.startswith('__MACOSX') or filename.endswith('.DS_Store'):
                        continue

                    content = zip_ref.read(filename).decode('utf-8', errors='ignore')
                    
                    # infer language
                    lang = 'plaintext'
                    if filename.endswith('.py'): lang = 'python'
                    elif filename.endswith(('.js', '.jsx')): lang = 'javascript'
                    elif filename.endswith(('.ts', '.tsx')): lang = 'typescript'
                    elif filename.endswith('.html'): lang = 'html'
                    elif filename.endswith('.css'): lang = 'css'
                    elif filename.endswith('.json'): lang = 'json'
                    elif filename.endswith('.md'): lang = 'markdown'
                    elif filename.endswith('.sql'): lang = 'sql'

                    pfile, _ = ProjectFile.objects.update_or_create(
                        project=project,
                        path=filename,
                        defaults={'language': lang, 'current_content': content}
                    )
                    FileVersion.objects.create(
                        file=pfile,
                        content=content,
                        author=request.user,
                        commit_message=f'Uploaded via zip import: {filename}'
                    )
                    created_files.append(pfile)

            return Response({
                'message': f'Successfully imported {len(created_files)} files into project.',
                'project': ProjectSerializer(project).data
            })
        except Exception as e:
            return Response({'error': f'Failed to parse zip archive: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='download')
    def download_zip(self, request, pk=None):
        project = self.get_object()
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for pfile in project.files.all():
                zip_file.writestr(pfile.path, pfile.current_content)

        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{project.name.replace(" ", "_")}.zip"'
        return response

class ProjectFileViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectFileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ProjectFile.objects.filter(project__owner=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        new_content = request.data.get('current_content', instance.current_content)
        commit_message = request.data.get('commit_message', 'Saved changes')

        content_changed = new_content != instance.current_content

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if content_changed:
            FileVersion.objects.create(
                file=instance,
                content=new_content,
                author=request.user,
                commit_message=commit_message
            )
            ActivityLog.objects.create(
                user=request.user,
                action_type='file_saved',
                target_type='file',
                target_id=str(instance.id),
                metadata={'path': instance.path, 'project_id': instance.project.id}
            )

        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='versions')
    def versions(self, request, pk=None):
        pfile = self.get_object()
        versions = pfile.versions.all()
        return Response(FileVersionSerializer(versions, many=True).data)

    @action(detail=True, methods=['post'], url_path=r'revert/(?P<version_id>\d+)')
    def revert(self, request, pk=None, version_id=None):
        pfile = self.get_object()
        try:
            target_version = FileVersion.objects.get(id=version_id, file=pfile)
        except FileVersion.DoesNotExist:
            return Response({'error': 'Target file version not found'}, status=status.HTTP_404_NOT_FOUND)

        pfile.current_content = target_version.content
        pfile.save()

        # Create new version record for revert action
        new_v = FileVersion.objects.create(
            file=pfile,
            content=pfile.current_content,
            author=request.user,
            commit_message=f'Reverted to version from {target_version.created_at.strftime("%Y-%m-%d %H:%M")}'
        )

        ActivityLog.objects.create(
            user=request.user,
            action_type='file_reverted',
            target_type='file',
            target_id=str(pfile.id),
            metadata={'path': pfile.path, 'reverted_to_version': target_version.id}
        )

        return Response({
            'message': 'File successfully reverted',
            'file': ProjectFileSerializer(pfile).data,
            'version': FileVersionSerializer(new_v).data
        })
