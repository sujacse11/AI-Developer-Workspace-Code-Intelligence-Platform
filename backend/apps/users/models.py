from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    PLAN_CHOICES = (
        ('free', 'Free Tier'),
        ('pro', 'Developer Pro'),
        ('enterprise', 'Enterprise Team'),
    )
    
    DOC_TYPES = (
        ('passport', 'Passport'),
        ('national_id', 'National ID Card'),
        ('drivers_license', 'Drivers License'),
    )
    
    avatar = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True, default='')
    preferred_languages = models.JSONField(default=list, blank=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    
    # Compulsory Contact & KYC Verification Fields
    phone_number = models.CharField(max_length=30, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    kyc_verified = models.BooleanField(default=False)
    id_document_type = models.CharField(max_length=30, choices=DOC_TYPES, default='national_id')
    id_document_number = models.CharField(max_length=100, blank=True, default='')

    # Forgot Password reset token fields
    reset_password_token = models.CharField(max_length=100, blank=True, null=True)
    reset_password_expires = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action_type = models.CharField(max_length=100) # e.g. 'project_create', 'ai_find_bugs', 'file_save'
    target_type = models.CharField(max_length=100, blank=True, default='') # 'project', 'file', 'ai_job'
    target_id = models.CharField(max_length=100, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.action_type} @ {self.created_at}"
