from django.db import models
from django.conf import settings
from apps.projects.models import Project, ProjectFile

class ProjectMember(models.Model):
    ROLE_CHOICES = (
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
        ('admin', 'Admin'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='editor')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.username} as {self.role} in {self.project.name}"

class LineComment(models.Model):
    file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='line_comments')
    line_number = models.IntegerField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    body = models.TextField()
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['line_number', 'created_at']

    def __str__(self):
        return f"Comment on {self.file.path}:L{self.line_number} by {self.author.username}"
