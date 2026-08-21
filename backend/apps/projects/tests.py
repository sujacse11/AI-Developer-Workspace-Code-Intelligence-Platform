import io
import zipfile
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.projects.models import Project, ProjectFile, FileVersion

User = get_user_model()

class ProjectsAppTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_project(self):
        response = self.client.post('/api/v1/projects/', {
            'name': 'Test Python Service',
            'description': 'A test microservice',
            'language_stack': 'python',
            'visibility': 'private'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Test Python Service')
        self.assertEqual(response.data['file_count'], 1)
        
        # Verify initial boilerplate file was created
        project_id = response.data['id']
        project = Project.objects.get(id=project_id)
        self.assertEqual(project.files.count(), 1)
        initial_file = project.files.first()
        self.assertEqual(initial_file.path, 'main.py')
        self.assertEqual(initial_file.versions.count(), 1)

    def test_create_file_and_batch_files(self):
        project = Project.objects.create(owner=self.user, name='Web App', language_stack='javascript')
        
        # Test single file creation
        res = self.client.post(f'/api/v1/projects/{project.id}/files/', {
            'path': 'src/index.js',
            'language': 'javascript',
            'content': 'console.log("Hello");'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['path'], 'src/index.js')

        # Test batch file creation
        batch_res = self.client.post(f'/api/v1/projects/{project.id}/batch-files/', {
            'files': [
                {'path': 'src/utils.js', 'language': 'javascript', 'content': 'export const add = (a, b) => a + b;'},
                {'path': 'src/styles.css', 'language': 'css', 'content': 'body { margin: 0; }'}
            ]
        }, format='json')
        self.assertEqual(batch_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(batch_res.data['created_files']), 2)
        self.assertEqual(project.files.count(), 3)

    def test_edit_file_language_and_save(self):
        project = Project.objects.create(owner=self.user, name='Data Service', language_stack='python')
        pfile = ProjectFile.objects.create(
            project=project,
            path='script.py',
            language='python',
            current_content='print("Original")'
        )

        # Update content and language
        update_res = self.client.put(f'/api/v1/files/{pfile.id}/', {
            'current_content': 'print("Updated code")',
            'language': 'python',
            'commit_message': 'Manual user update'
        }, format='json')
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        
        pfile.refresh_from_db()
        self.assertEqual(pfile.current_content, 'print("Updated code")')
        self.assertEqual(pfile.versions.count(), 1)

    def test_file_version_history_and_revert(self):
        project = Project.objects.create(owner=self.user, name='Versioned App', language_stack='python')
        pfile = ProjectFile.objects.create(
            project=project,
            path='app.py',
            language='python',
            current_content='version 1 content'
        )
        v1 = FileVersion.objects.create(file=pfile, content='version 1 content', author=self.user, commit_message='v1 snapshot')
        
        # Save version 2
        self.client.put(f'/api/v1/files/{pfile.id}/', {
            'current_content': 'version 2 content',
            'commit_message': 'v2 update'
        }, format='json')

        # Check version count
        versions_res = self.client.get(f'/api/v1/files/{pfile.id}/versions/')
        self.assertEqual(versions_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(versions_res.data), 2)

        # Revert back to v1
        revert_res = self.client.post(f'/api/v1/files/{pfile.id}/revert/{v1.id}/')
        self.assertEqual(revert_res.status_code, status.HTTP_200_OK)
        
        pfile.refresh_from_db()
        self.assertEqual(pfile.current_content, 'version 1 content')

    def test_upload_raw_source_file_and_zip(self):
        project = Project.objects.create(owner=self.user, name='Upload Test Project', language_stack='python')

        # 1. Direct raw file upload
        raw_file = io.BytesIO(b'def helper(): return 42\n')
        raw_file.name = 'helper.py'
        
        res_raw = self.client.post(f'/api/v1/projects/{project.id}/upload/', {
            'files': [raw_file]
        }, format='multipart')
        self.assertEqual(res_raw.status_code, status.HTTP_200_OK)
        self.assertTrue(ProjectFile.objects.filter(project=project, path='helper.py').exists())

        # 2. Zip archive upload
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zf:
            zf.writestr('zipped/module.py', 'print("zip content")')
        zip_buffer.seek(0)
        zip_buffer.name = 'archive.zip'

        res_zip = self.client.post(f'/api/v1/projects/{project.id}/upload/', {
            'file': zip_buffer
        }, format='multipart')
        self.assertEqual(res_zip.status_code, status.HTTP_200_OK)
        self.assertTrue(ProjectFile.objects.filter(project=project, path='zipped/module.py').exists())

    def test_download_project_zip(self):
        project = Project.objects.create(owner=self.user, name='Export Project', language_stack='python')
        ProjectFile.objects.create(project=project, path='main.py', language='python', current_content='print("Export")')

        dl_res = self.client.get(f'/api/v1/projects/{project.id}/download/')
        self.assertEqual(dl_res.status_code, status.HTTP_200_OK)
        self.assertEqual(dl_res['Content-Type'], 'application/zip')
