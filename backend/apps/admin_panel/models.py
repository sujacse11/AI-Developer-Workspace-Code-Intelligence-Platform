from django.db import models

class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict)
    description = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key} = {self.value}"

class FeatureFlag(models.Model):
    feature_name = models.CharField(max_length=100, unique=True)
    is_enabled = models.BooleanField(default=True)
    allowed_roles = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Flag {self.feature_name}: {'Enabled' if self.is_enabled else 'Disabled'}"
