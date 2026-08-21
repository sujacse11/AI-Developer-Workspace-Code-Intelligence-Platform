from rest_framework import serializers
from apps.projects.models import Project, ProjectFile, FileVersion

class FileVersionSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = FileVersion
        fields = ('id', 'file', 'content', 'diff_summary', 'author', 'author_username', 'commit_message', 'created_at')
        read_only_fields = ('id', 'created_at')

class ProjectFileSerializer(serializers.ModelSerializer):
    version_count = serializers.IntegerField(source='versions.count', read_only=True)

    class Meta:
        model = ProjectFile
        fields = ('id', 'project', 'path', 'language', 'current_content', 'size', 'version_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'size', 'version_count', 'created_at', 'updated_at')

class ProjectSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    file_count = serializers.IntegerField(source='files.count', read_only=True)
    files = ProjectFileSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'owner', 'owner_username', 'name', 'description', 'language_stack', 'visibility', 'file_count', 'files', 'created_at', 'updated_at')
        read_only_fields = ('id', 'owner', 'owner_username', 'file_count', 'files', 'created_at', 'updated_at')
