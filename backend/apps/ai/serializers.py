from rest_framework import serializers
from apps.ai.models import AIJob, AIActionResult

class AIJobSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AIJob
        fields = ('job_id', 'user', 'user_username', 'project', 'action_type', 'status', 'input_params', 'result', 'error_message', 'tokens_used', 'created_at', 'completed_at')
        read_only_fields = ('job_id', 'user', 'status', 'result', 'error_message', 'tokens_used', 'created_at', 'completed_at')

class AIActionResultSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    file_path = serializers.ReadOnlyField(source='file.path')

    class Meta:
        model = AIActionResult
        fields = ('id', 'job', 'user', 'user_username', 'project', 'file', 'file_path', 'action_type', 'score', 'summary', 'structured_payload', 'created_at')
        read_only_fields = ('id', 'created_at')
