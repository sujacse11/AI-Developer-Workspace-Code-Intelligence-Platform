from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.models import ActivityLog

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'bio', 'preferred_languages')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            bio=validated_data.get('bio', ''),
            preferred_languages=validated_data.get('preferred_languages', ['python', 'javascript'])
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'bio', 'preferred_languages', 'plan', 'is_staff', 'created_at')
        read_only_fields = ('id', 'username', 'email', 'plan', 'is_staff', 'created_at')

class ActivityLogSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ActivityLog
        fields = ('id', 'user', 'user_username', 'action_type', 'target_type', 'target_id', 'metadata', 'created_at')
