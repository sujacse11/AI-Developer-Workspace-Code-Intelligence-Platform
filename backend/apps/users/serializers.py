import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.models import ActivityLog

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=True, min_length=2)
    last_name = serializers.CharField(required=True, min_length=2)
    phone_number = serializers.CharField(required=True, min_length=8)
    country = serializers.CharField(required=True, min_length=2)
    id_document_type = serializers.ChoiceField(choices=User.DOC_TYPES, required=True)
    id_document_number = serializers.CharField(required=True, min_length=4)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'phone_number', 'country', 'id_document_type', 'id_document_number',
            'bio', 'preferred_languages'
        )

    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', value):
            raise serializers.ValidationError(
                "Username must be 3-30 characters long and contain only letters, numbers, and underscores."
            )
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if not value or '@' not in value:
            raise serializers.ValidationError("A valid email address is required.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_phone_number(self, value):
        clean_num = re.sub(r'[\s\-\+\(\)]', '', value)
        if not clean_num.isdigit() or len(clean_num) < 8 or len(clean_num) > 15:
            raise serializers.ValidationError("Phone number must contain between 8 and 15 valid digits.")
        return value

    def validate_id_document_number(self, value):
        if not value.strip():
            raise serializers.ValidationError("KYC Check requirement: ID Document number cannot be empty.")
        return value.strip()

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one numeric digit.")
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', value):
            raise serializers.ValidationError("Password must contain at least one special character (!@#$%^&*).")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number'],
            country=validated_data['country'],
            id_document_type=validated_data['id_document_type'],
            id_document_number=validated_data['id_document_number'],
            kyc_verified=True, # KYC Verified upon complete registration
            bio=validated_data.get('bio', ''),
            preferred_languages=validated_data.get('preferred_languages', ['python', 'javascript'])
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'country',
            'kyc_verified', 'id_document_type', 'id_document_number', 'avatar', 'bio',
            'preferred_languages', 'plan', 'is_staff', 'created_at'
        )
        read_only_fields = ('id', 'username', 'email', 'kyc_verified', 'plan', 'is_staff', 'created_at')

    def validate_phone_number(self, value):
        if value:
            clean_num = re.sub(r'[\s\-\+\(\)]', '', value)
            if not clean_num.isdigit() or len(clean_num) < 8 or len(clean_num) > 15:
                raise serializers.ValidationError("Phone number must contain between 8 and 15 valid digits.")
        return value

    def validate_id_document_number(self, value):
        if value is not None and not value.strip():
            raise serializers.ValidationError("ID Document number cannot be empty.")
        return value.strip() if value else value

class ActivityLogSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ActivityLog
        fields = ('id', 'user', 'user_username', 'action_type', 'target_type', 'target_id', 'metadata', 'created_at')

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("No account registered with this email address.")
        return value.lower()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one numeric digit.")
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', value):
            raise serializers.ValidationError("Password must contain at least one special character (!@#$%^&*).")
        return value
