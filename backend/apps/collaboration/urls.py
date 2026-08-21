from django.urls import path
from apps.collaboration.views import (
    ProjectMemberListCreateView,
    LineCommentListCreateView,
    CombinedReviewHistoryView
)

urlpatterns = [
    path('projects/<int:project_id>/members/', ProjectMemberListCreateView.as_view(), name='project-members'),
    path('files/<int:file_id>/comments/', LineCommentListCreateView.as_view(), name='file-comments'),
    path('projects/<int:project_id>/review-history/', CombinedReviewHistoryView.as_view(), name='review-history'),
]
