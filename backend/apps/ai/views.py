import threading
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.ai.models import AIJob, AIActionResult
from apps.ai.serializers import AIJobSerializer, AIActionResultSerializer
from apps.ai.services import ACTION_SERVICE_REGISTRY
from apps.projects.models import Project

def run_ai_job_in_thread(job_id):
    """Background execution worker thread for non-blocking API jobs."""
    try:
        job = AIJob.objects.get(job_id=job_id)
        service_cls = ACTION_SERVICE_REGISTRY.get(job.action_type)
        if service_cls:
            service = service_cls(job)
            service.execute()
        else:
            job.status = 'failed'
            job.error_message = f"Unsupported action type '{job.action_type}'"
            job.save()
    except Exception as e:
        try:
            job = AIJob.objects.get(job_id=job_id)
            job.status = 'failed'
            job.error_message = str(e)
            job.save()
        except:
            pass

class AIExecuteView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        action_type = request.data.get('action')
        project_id = request.data.get('project_id')
        code = request.data.get('code', '')
        language = request.data.get('language', 'python')
        options = request.data.get('options', {})

        if not action_type or action_type not in ACTION_SERVICE_REGISTRY:
            return Response(
                {'error': f"Invalid or missing action. Available actions: {list(ACTION_SERVICE_REGISTRY.keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        project = None
        if project_id:
            try:
                project = Project.objects.get(id=project_id, owner=request.user)
            except Project.DoesNotExist:
                pass

        # Create job entry
        job = AIJob.objects.create(
            user=request.user,
            project=project,
            action_type=action_type,
            status='queued',
            input_params={
                'code': code,
                'language': language,
                'options': options,
                'file_id': request.data.get('file_id'),
                'prompt': request.data.get('prompt', ''),
                'error_text': request.data.get('error_text', '')
            }
        )

        # Launch background execution worker
        t = threading.Thread(target=run_ai_job_in_thread, args=(job.job_id,))
        t.start()

        return Response({
            'job_id': str(job.job_id),
            'action_type': action_type,
            'status': 'queued',
            'message': 'AI intelligence job queued successfully.'
        }, status=status.HTTP_202_ACCEPTED)

class AIJobDetailView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = AIJobSerializer
    queryset = AIJob.objects.all()
    lookup_field = 'job_id'

    def get_queryset(self):
        return AIJob.objects.filter(user=self.request.user)

class AIHistoryListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = AIActionResultSerializer

    def get_queryset(self):
        qs = AIActionResult.objects.filter(user=self.request.user)
        project_id = self.request.query_params.get('project_id')
        action_type = self.request.query_params.get('action')
        if project_id:
            qs = qs.filter(project_id=project_id)
        if action_type:
            qs = qs.filter(action_type=action_type)
        return qs[:50]
