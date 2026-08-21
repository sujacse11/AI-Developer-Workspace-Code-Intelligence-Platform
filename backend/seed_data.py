import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.projects.models import Project, ProjectFile, FileVersion
from apps.ai.models import AIJob, AIActionResult
from apps.collaboration.models import ProjectMember, LineComment
from apps.admin_panel.models import SystemSetting, FeatureFlag
from apps.users.models import ActivityLog

User = get_user_model()

def seed():
    print("Seeding database...")
    
    # 1. Create Admin User
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@platform.ai',
            'is_staff': True,
            'is_superuser': True,
            'plan': 'enterprise',
            'bio': 'Principal AI Platform Administrator',
            'preferred_languages': ['python', 'typescript', 'sql']
        }
    )
    if created or not admin.check_password('admin123'):
        admin.set_password('admin123')
        admin.save()

    # 2. Create Demo User
    demo_user, created = User.objects.get_or_create(
        username='developer',
        defaults={
            'email': 'dev@platform.ai',
            'is_staff': False,
            'plan': 'pro',
            'bio': 'Full-Stack Software Engineer',
            'preferred_languages': ['python', 'javascript', 'html']
        }
    )
    if created or not demo_user.check_password('dev12345'):
        demo_user.set_password('dev12345')
        demo_user.save()

    # 3. Create Demo Projects & Files
    project1, _ = Project.objects.get_or_create(
        name='AI Analytics Engine',
        owner=demo_user,
        defaults={
            'description': 'Real-time telemetry and data processing microservice',
            'language_stack': 'python',
            'visibility': 'public'
        }
    )

    file1, _ = ProjectFile.objects.get_or_create(
        project=project1,
        path='analytics.py',
        defaults={
            'language': 'python',
            'current_content': '''import time
import requests

def calculate_metrics(events: list) -> dict:
    """Calculate aggregated metrics from stream events."""
    total = 0
    errors = 0
    
    for event in events:
        if event.get('type') == 'error':
            errors += 1
        total += event.get('value', 0)
        
    avg = total / len(events) if events else 0
    return {
        'total_value': total,
        'error_rate': errors / len(events) if events else 0,
        'average': avg
    }

def main():
    sample_data = [
        {'type': 'click', 'value': 10},
        {'type': 'error', 'value': 0},
        {'type': 'buy', 'value': 50}
    ]
    print("Metrics Result:", calculate_metrics(sample_data))

if __name__ == '__main__':
    main()
'''
        }
    )
    FileVersion.objects.get_or_create(
        file=file1,
        content=file1.current_content,
        author=demo_user,
        commit_message='Initial stream processor code'
    )

    file2, _ = ProjectFile.objects.get_or_create(
        project=project1,
        path='queries.sql',
        defaults={
            'language': 'sql',
            'current_content': '''-- Daily event aggregation query
SELECT 
    DATE(created_at) AS event_date,
    action_type,
    COUNT(*) AS total_triggers,
    AVG(duration_ms) AS avg_latency
FROM telemetry_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), action_type
ORDER BY event_date DESC;
'''
        }
    )

    # Project 2
    project2, _ = Project.objects.get_or_create(
        name='React Dashboard Workspace',
        owner=demo_user,
        defaults={
            'description': 'Modern web dashboard built with React and Tailwind CSS',
            'language_stack': 'javascript',
            'visibility': 'private'
        }
    )
    file3, _ = ProjectFile.objects.get_or_create(
        project=project2,
        path='App.jsx',
        defaults={
            'language': 'javascript',
            'current_content': '''import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 max-w-md mx-auto bg-slate-900 text-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-cyan-400">AI Code Workspace</h1>
      <p className="mb-4">Interactive counter component demo.</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition text-white font-medium"
      >
        Count: {count}
      </button>
    </div>
  );
}
'''
        }
    )

    # 4. Seed Initial Feature Flags & System Settings
    SystemSetting.objects.get_or_create(
        key='max_tokens_per_request',
        defaults={'value': 4096, 'description': 'Maximum context window tokens per AI action'}
    )
    SystemSetting.objects.get_or_create(
        key='active_llm_model',
        defaults={'value': 'Claude 3.5 Sonnet', 'description': 'Primary LLM inference engine'}
    )

    feature_keys = [
        'explain_code', 'find_bugs', 'fix_bugs', 'optimize_code', 'generate_code',
        'convert_code', 'generate_comments', 'generate_docs', 'generate_tests',
        'generate_sql', 'explain_error', 'detect_security', 'code_quality',
        'complexity_analysis', 'ai_code_review'
    ]
    for key in feature_keys:
        FeatureFlag.objects.get_or_create(
            feature_name=key,
            defaults={'is_enabled': True, 'allowed_roles': ['free', 'pro', 'enterprise']}
        )

    # 5. Activity Log Seed
    ActivityLog.objects.get_or_create(
        user=demo_user,
        action_type='user_registered',
        defaults={'target_type': 'user', 'target_id': str(demo_user.id), 'metadata': {'username': 'developer'}}
    )
    ActivityLog.objects.get_or_create(
        user=demo_user,
        action_type='project_created',
        defaults={'target_type': 'project', 'target_id': str(project1.id), 'metadata': {'name': project1.name}}
    )

    print("Successfully seeded demo users, projects, files, settings, and flags!")

if __name__ == '__main__':
    seed()
