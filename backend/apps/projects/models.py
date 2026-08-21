from django.db import models
from django.conf import settings

class Project(models.Model):
    VISIBILITY_CHOICES = (
        ('private', 'Private'),
        ('public', 'Public'),
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_projects')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    language_stack = models.CharField(max_length=100, default='python') # primary stack e.g. python, javascript, fullstack
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='private')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.owner.username})"

class ProjectFile(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    path = models.CharField(max_length=500) # relative path within project e.g. 'src/index.js' or 'main.py'
    language = models.CharField(max_length=50, default='python') # monaco language id
    current_content = models.TextField(blank=True, default='')
    size = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'path')
        ordering = ['path']

    def save(self, *args, **kwargs):
        self.size = len(self.current_content.encode('utf-8'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.name} - {self.path}"

class FileVersion(models.Model):
    file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='versions')
    content = models.TextField()
    diff_summary = models.TextField(blank=True, default='')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    commit_message = models.CharField(max_length=255, default='Auto-save snapshot')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file.path} v@{self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
