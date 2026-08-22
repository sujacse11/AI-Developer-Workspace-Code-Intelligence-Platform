import os
import sys
import uuid
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.projects.models import Project, ProjectFile, FileVersion
from apps.ai.models import AIJob, AIActionResult
from apps.collaboration.models import ProjectMember, LineComment
from apps.admin_panel.models import SystemSetting, FeatureFlag
from apps.users.models import ActivityLog

User = get_user_model()

def seed():
    print("Seeding database with comprehensive end-to-end dataset...")
    try:
        # ==========================================
        # 1. USER MODULE SEEDING (Admin, Dev, Reviewer)
        # ==========================================
        admin, _ = User.objects.get_or_create(username='admin')
        admin.email = 'admin@platform.ai'
        admin.first_name = 'Sarah'
        admin.last_name = 'Connor'
        admin.is_staff = True
        admin.is_superuser = True
        admin.plan = 'enterprise'
        admin.bio = 'Principal AI Platform Administrator & Lead Architect'
        admin.preferred_languages = ['python', 'typescript', 'sql', 'rust']
        admin.phone_number = '+91 98765 43210'
        admin.country = 'India'
        admin.kyc_verified = True
        admin.id_document_type = 'aadhaar'
        admin.id_document_number = '1234 5678 9012'
        if not admin.check_password('admin123'):
            admin.set_password('admin123')
        admin.save()

        developer, _ = User.objects.get_or_create(username='developer')
        developer.email = 'dev@platform.ai'
        developer.first_name = 'Alex'
        developer.last_name = 'Mercer'
        developer.is_staff = False
        developer.plan = 'free'
        developer.bio = 'Full-Stack Engineer specialized in React, Python, and Microservices'
        developer.preferred_languages = ['python', 'javascript', 'html', 'css']
        developer.phone_number = '+91 91234 56789'
        developer.country = 'India'
        developer.kyc_verified = True
        developer.id_document_type = 'aadhaar'
        developer.id_document_number = '9876 5432 1098'
        if not developer.check_password('dev12345'):
            developer.set_password('dev12345')
        developer.save()

        reviewer, _ = User.objects.get_or_create(username='reviewer')
        reviewer.email = 'reviewer@platform.ai'
        reviewer.first_name = 'Elena'
        reviewer.last_name = 'Rostova'
        reviewer.is_staff = False
        reviewer.plan = 'free'
        reviewer.bio = 'Senior Code Reviewer & Security Specialist'
        reviewer.preferred_languages = ['python', 'sql', 'go']
        reviewer.phone_number = '+91 95550 12345'
        reviewer.country = 'India'
        reviewer.kyc_verified = True
        reviewer.id_document_type = 'aadhaar'
        reviewer.id_document_number = '4321 8765 2109'
        if not reviewer.check_password('reviewer123'):
            reviewer.set_password('reviewer123')
        reviewer.save()

        # Update any other user missing or non-compliant profile fields
        for user in User.objects.all():
            changed = False
            if not user.is_staff and user.plan != 'free':
                user.plan = 'free'
                changed = True
            if user.country != 'India':
                user.country = 'India'
                changed = True
            if not user.phone_number or not user.phone_number.startswith('+91'):
                user.phone_number = '+91 98765 00000'
                changed = True
            if user.id_document_type != 'aadhaar':
                user.id_document_type = 'aadhaar'
                changed = True
            if not user.id_document_number:
                user.id_document_number = '1122 3344 5566'
                changed = True
            if changed:
                user.save()

        # ==========================================
        # 2. CODE WORKSPACE SEEDING (Projects, Files, Versions)
        # ==========================================
        # Project 1: Python Stream Engine
        proj1, _ = Project.objects.get_or_create(
            name='AI Telemetry Stream Processor',
            owner=developer,
            defaults={
                'description': 'Real-time telemetry metric processing microservice built with Python',
                'language_stack': 'python',
                'visibility': 'public'
            }
        )

        file1_1, _ = ProjectFile.objects.get_or_create(
            project=proj1,
            path='analytics.py',
            defaults={
                'language': 'python',
                'current_content': '''import time
import requests

def calculate_metrics(events: list) -> dict:
    """Calculate aggregated metrics from telemetry stream events."""
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
    sample_events = [
        {'type': 'click', 'value': 10},
        {'type': 'error', 'value': 0},
        {'type': 'purchase', 'value': 50}
    ]
    metrics = calculate_metrics(sample_events)
    print("Telemetry Metrics Output:", metrics)

if __name__ == '__main__':
    main()
'''
            }
        )

        FileVersion.objects.get_or_create(
            file=file1_1,
            commit_message='Initial stream telemetry processor baseline',
            defaults={'content': file1_1.current_content, 'author': developer}
        )
        FileVersion.objects.get_or_create(
            file=file1_1,
            commit_message='Added error handling and default zero division guard',
            defaults={'content': file1_1.current_content, 'author': developer}
        )

        file1_2, _ = ProjectFile.objects.get_or_create(
            project=proj1,
            path='queries.sql',
            defaults={
                'language': 'sql',
                'current_content': '''-- Daily Telemetry Aggregation SQL Query
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

        # Project 2: React Dashboard
        proj2, _ = Project.objects.get_or_create(
            name='React Dashboard Workspace',
            owner=developer,
            defaults={
                'description': 'Modern web application workspace built with React and Tailwind CSS',
                'language_stack': 'javascript',
                'visibility': 'private'
            }
        )

        file2_1, _ = ProjectFile.objects.get_or_create(
            project=proj2,
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
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition font-semibold"
      >
        Increment Count: {count}
      </button>
    </div>
  );
}
'''
            }
        )

        # ==========================================
        # 3. AI FEATURES SEEDING (All 15 Actions)
        # ==========================================
        ai_action_seeds = [
            ('explain_code', 95, 'Natural language code breakdown of analytics.py logic.'),
            ('find_bugs', 85, 'Found 2 mild warnings regarding bare exception swallowing.'),
            ('fix_bugs', 92, 'Applied automated patch for type guards and zero division.'),
            ('optimize_code', 90, 'Refactored loop iterations, achieving 18% CPU reduction.'),
            ('generate_code', 96, 'Generated API request client with timeout handling.'),
            ('convert_code', 94, 'Converted Python stream processor function into TypeScript.'),
            ('generate_comments', 98, 'Inserted inline docstrings across all exported functions.'),
            ('generate_docs', 95, 'Generated comprehensive Markdown API documentation.'),
            ('generate_tests', 93, 'Synthesized Pytest unit test suite with 4 test cases.'),
            ('generate_sql', 97, 'Built aggregated SQL query with indexing recommendations.'),
            ('explain_error', 91, 'Pinpointed KeyError root cause and provided 3-step fix.'),
            ('detect_security', 88, 'OWASP audit complete. Scanned for hardcoded credentials.'),
            ('code_quality', 92, 'Calculated overall Maintainability Index: 92/100.'),
            ('complexity_analysis', 89, 'Cyclomatic Complexity score is 4 (Grade A).'),
            ('ai_code_review', 94, 'Senior PR Code Review complete. Approved for production.')
        ]

        for action_key, score, summary in ai_action_seeds:
            job, _ = AIJob.objects.get_or_create(
                user=developer,
                project=proj1,
                action_type=action_key,
                defaults={
                    'status': 'completed',
                    'input_params': {'code': file1_1.current_content, 'language': 'python'},
                    'result': {
                        'summary': summary,
                        'score': score,
                        'explanation': f'Detailed AI execution analysis for {action_key}.'
                    },
                    'tokens_used': 340,
                    'completed_at': timezone.now()
                }
            )

            AIActionResult.objects.get_or_create(
                job=job,
                defaults={
                    'user': developer,
                    'project': proj1,
                    'file': file1_1,
                    'action_type': action_key,
                    'score': score,
                    'summary': summary,
                    'structured_payload': job.result
                }
            )

        # ==========================================
        # 4. COLLABORATION SEEDING (Members & Line Comments)
        # ==========================================
        ProjectMember.objects.get_or_create(
            project=proj1,
            user=reviewer,
            defaults={'role': 'editor'}
        )
        ProjectMember.objects.get_or_create(
            project=proj1,
            user=admin,
            defaults={'role': 'admin'}
        )

        LineComment.objects.get_or_create(
            file=file1_1,
            line_number=14,
            author=reviewer,
            defaults={
                'body': 'Consider adding explicit type annotations to events list items.',
                'resolved': False
            }
        )

        # ==========================================
        # 5. ADMIN MODULE SEEDING (Settings & Feature Flags)
        # ==========================================
        SystemSetting.objects.get_or_create(
            key='max_tokens_per_request',
            defaults={'value': 4096, 'description': 'Maximum token context window for AI actions'}
        )
        SystemSetting.objects.get_or_create(
            key='active_llm_model',
            defaults={'value': 'Groq LLaMA 3.3 70B (Production)', 'description': 'Primary LLM inference engine'}
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

        # ==========================================
        # 6. ACTIVITY LOG SEEDING
        # ==========================================
        ActivityLog.objects.get_or_create(
            user=developer,
            action_type='user_registered_kyc_verified',
            defaults={'target_type': 'user', 'target_id': str(developer.id), 'metadata': {'username': 'developer'}}
        )
        ActivityLog.objects.get_or_create(
            user=developer,
            action_type='project_created',
            defaults={'target_type': 'project', 'target_id': str(proj1.id), 'metadata': {'name': proj1.name}}
        )

        print("End-to-end database seeding completed successfully!")

    except Exception as e:
        print(f"Seed process notification: {e}")

if __name__ == '__main__':
    seed()
