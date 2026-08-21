from rest_framework import serializers
from apps.collaboration.models import ProjectMember, LineComment

class ProjectMemberSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = ProjectMember
        fields = ('id', 'project', 'user', 'username', 'email', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')

class LineCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    author_avatar = serializers.ReadOnlyField(source='author.avatar')
    replies_count = serializers.IntegerField(source='replies.count', read_only=True)

    class Meta:
        model = LineComment
        fields = ('id', 'file', 'line_number', 'author', 'author_username', 'author_avatar', 'body', 'parent_comment', 'resolved', 'replies_count', 'created_at')
        read_only_fields = ('id', 'author', 'file', 'created_at')
