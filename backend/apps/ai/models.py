import uuid
from django.db import models
from django.conf import settings
from apps.projects.models import Project, ProjectFile

class AIJob(models.Model):
    STATUS_CHOICES = (
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    job_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_jobs')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='ai_jobs', null=True, blank=True)
    action_type = models.CharField(max_length=50) # e.g. 'find_bugs', 'explain_code'
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    input_params = models.JSONField(default=dict, blank=True)
    result = models.JSONField(default=dict, blank=True, null=True)
    error_message = models.TextField(blank=True, default='')
    tokens_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AIJob {self.action_type} [{self.status}] - {self.job_id}"

class AIActionResult(models.Model):
    job = models.OneToOneField(AIJob, on_delete=models.CASCADE, related_name='action_result')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_results')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='ai_results', null=True, blank=True)
    file = models.ForeignKey(ProjectFile, on_delete=models.SET_NULL, related_name='ai_results', null=True, blank=True)
    action_type = models.CharField(max_length=50)
    score = models.IntegerField(null=True, blank=True) # 0-100 quality/security score if applicable
    summary = models.TextField()
    structured_payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} result for {self.user.username} @ {self.created_at}"
