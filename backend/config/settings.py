import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# Include apps folder in python path
import sys
sys.path.insert(0, str(BASE_DIR))

# Production & Environment settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-ai-workspace-super-secret-key-production-ready')
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',
    
    # Local apps
    'apps.users.apps.UsersConfig',
    'apps.projects.apps.ProjectsConfig',
    'apps.ai.apps.AiConfig',
    'apps.collaboration.apps.CollaborationConfig',
    'apps.admin_panel.apps.AdminPanelConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database Configuration: MySQL / Render DATABASE_URL / SQLite fallback
import dj_database_url

DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()
DB_ENGINE = os.environ.get('DB_ENGINE', '').lower().strip()
DB_HOST = os.environ.get('DB_HOST', '').strip()

if DB_ENGINE in ('mysql', 'aiven') and DB_HOST:
    import pymysql
    pymysql.install_as_MySQLdb()
    
    db_options = {}
    ssl_ca = os.environ.get('DB_SSL_CA')
    if ssl_ca and os.path.exists(ssl_ca):
        db_options['ssl'] = {'ca': ssl_ca}
    elif os.environ.get('DB_SSL_MODE') == 'REQUIRED':
        db_options['ssl'] = {'ssl_mode': 'REQUIRED'}

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('DB_NAME', 'defaultdb'),
            'USER': os.environ.get('DB_USER', 'avnadmin'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': DB_HOST,
            'PORT': os.environ.get('DB_PORT', '3306'),
            'OPTIONS': db_options,
        }
    }
elif DATABASE_URL and DB_ENGINE != 'sqlite3':
    # Fix short internal Render hostname (e.g. dpg-xxx-a -> dpg-xxx-a.oregon-postgres.render.com)
    if 'dpg-' in DATABASE_URL and '.render.com' not in DATABASE_URL:
        # Try appending default Render PostgreSQL domain suffix
        parts = DATABASE_URL.split('@')
        if len(parts) == 2:
            user_pass, host_db = parts
            host_parts = host_db.split('/')
            if len(host_parts) == 2:
                host, dbname = host_parts
                if not host.endswith('.render.com'):
                    DATABASE_URL = f"{user_pass}@{host}.oregon-postgres.render.com/{dbname}"

    try:
        parsed_db = dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
        DATABASES = {'default': parsed_db}
    except Exception:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }







AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 6},
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'AI Developer Workspace & Code Intelligence API',
    'DESCRIPTION': 'REST API endpoints for authentication, project code workspace, AI intelligence actions, collaboration, and admin analytics.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
