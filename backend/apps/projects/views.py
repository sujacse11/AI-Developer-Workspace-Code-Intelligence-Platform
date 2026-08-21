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

    @action(detail=True, methods=['post'], url_path='batch-files')
    def batch_create_files(self, request, pk=None):
        project = self.get_object()
        files_data = request.data.get('files', [])
        if not files_data or not isinstance(files_data, list):
            return Response({'error': 'A non-empty "files" array is required'}, status=status.HTTP_400_BAD_REQUEST)

        created_files = []
        errors = []

        with transaction.atomic():
            for item in files_data:
                path = item.get('path', '').strip()
                if not path:
                    continue
                
                lang = item.get('language')
                if not lang:
                    ext = path.split('.')[-1].lower() if '.' in path else ''
                    lang = 'python' if ext == 'py' else ('javascript' if ext in ['js', 'jsx'] else ('typescript' if ext in ['ts', 'tsx'] else ('html' if ext == 'html' else ('css' if ext == 'css' else ('sql' if ext == 'sql' else 'plaintext')))))
                
                content = item.get('content', f'# {path}\n')

                if ProjectFile.objects.filter(project=project, path=path).exists():
                    errors.append(f'File "{path}" already exists.')
                    continue

                pfile = ProjectFile.objects.create(
                    project=project,
                    path=path,
                    language=lang,
                    current_content=content
                )
                FileVersion.objects.create(
                    file=pfile,
                    content=content,
                    author=request.user,
                    commit_message=f'Created file {path} via batch creation'
                )
                created_files.append(pfile)

        return Response({
            'message': f'Successfully created {len(created_files)} files.',
            'created_files': ProjectFileSerializer(created_files, many=True).data,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_files else status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='upload')
    def upload_zip(self, request, pk=None):
        project = self.get_object()
        uploaded_files = request.FILES.getlist('files') or request.FILES.getlist('file')
        if not uploaded_files:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        def infer_language(filename):
            ext = filename.split('.')[-1].lower() if '.' in filename else ''
            lang_map = {
                'py': 'python', 'js': 'javascript', 'jsx': 'javascript',
                'ts': 'typescript', 'tsx': 'typescript', 'html': 'html',
                'css': 'css', 'json': 'json', 'md': 'markdown', 'sql': 'sql',
                'cpp': 'cpp', 'c': 'cpp', 'java': 'java', 'go': 'go',
                'rs': 'rust', 'php': 'php', 'cs': 'csharp', 'rb': 'ruby',
                'yaml': 'yaml', 'yml': 'yaml'
            }
            return lang_map.get(ext, 'plaintext')

        created_files = []
        try:
            for uploaded_file in uploaded_files:
                filename = uploaded_file.name
                if filename.endswith('.zip'):
                    with zipfile.ZipFile(uploaded_file, 'r') as zip_ref:
                        for file_info in zip_ref.infolist():
                            if file_info.is_dir():
                                continue
                            zname = file_info.filename
                            if zname.startswith('__MACOSX') or zname.endswith('.DS_Store'):
                                continue

                            content = zip_ref.read(zname).decode('utf-8', errors='ignore')
                            lang = infer_language(zname)
                            pfile, _ = ProjectFile.objects.update_or_create(
                                project=project,
                                path=zname,
                                defaults={'language': lang, 'current_content': content}
                            )
                            FileVersion.objects.create(
                                file=pfile,
                                content=content,
                                author=request.user,
                                commit_message=f'Uploaded via zip import: {zname}'
                            )
                            created_files.append(pfile)
                else:
                    # Direct raw source code file upload
                    content = uploaded_file.read().decode('utf-8', errors='ignore')
                    lang = infer_language(filename)
                    pfile, _ = ProjectFile.objects.update_or_create(
                        project=project,
                        path=filename,
                        defaults={'language': lang, 'current_content': content}
                    )
                    FileVersion.objects.create(
                        file=pfile,
                        content=content,
                        author=request.user,
                        commit_message=f'Uploaded raw source file: {filename}'
                    )
                    created_files.append(pfile)

            return Response({
                'message': f'Successfully imported {len(created_files)} file(s) into project.',
                'project': ProjectSerializer(project).data
            })
        except Exception as e:
            return Response({'error': f'Failed to process uploaded file(s): {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='download', permission_classes=[permissions.AllowAny])
    def download_zip(self, request, pk=None):
        # Support token in query param or standard request user authentication
        token = request.query_params.get('token')
        user = request.user

        if token and (not user or not user.is_authenticated):
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                from django.contrib.auth import get_user_model
                User = get_user_model()
                validated_token = AccessToken(token)
                user_id = validated_token['user_id']
                user = User.objects.get(id=user_id)
            except Exception:
                return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user or not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for pfile in project.files.all():
                zip_file.writestr(pfile.path, pfile.current_content or '')

        buffer.seek(0)
        zip_filename = f"{project.name.replace(' ', '_')}.zip"
        response = HttpResponse(buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{zip_filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response

class ProjectFileViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectFileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ProjectFile.objects.filter(project__owner=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
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
