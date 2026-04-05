from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
import ssl

# Load .env from the backend/ directory (where manage.py lives)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-fallback")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = [host.strip() for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0").split(",")]
print(f"DEBUG: ALLOWED_HOSTS is {ALLOWED_HOSTS}")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    # Local apps
    "accounts",
    "issues",
    "ai_engine",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "smartcivic.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "smartcivic.wsgi.application"

# ─── Database (PostgreSQL) ──────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "smartcivic"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# ─── Custom User Model ──────────────────────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"

# ─── Password Validation ─────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─── Internationalisation ────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# ─── Static & Media Files ────────────────────────────────────────────────────
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── CORS ────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

# ─── Django REST Framework ───────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}

# ─── Simple JWT ──────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ─── Email (Gmail SMTP) ───────────────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "smart.civicissue@gmail.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = f"SmartCivic <{os.getenv('EMAIL_HOST_USER', 'smart.civicissue@gmail.com')}>"

# ─── Frontend URL (for password reset links) ─────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ─── Fast2SMS (India SMS OTP) ────────────────────────────────────────────────
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")


# ── Celery (Upstash Serverless Redis — no Docker needed) ─────────────────────
# Get your free Upstash Redis URL from https://upstash.com
# Copy the rediss:// URL from your Upstash console
CELERY_BROKER_URL            = os.getenv("CELERY_BROKER_URL", "")
CELERY_RESULT_BACKEND        = os.getenv("CELERY_RESULT_BACKEND", "")
CELERY_BROKER_USE_SSL        = {"ssl_cert_reqs": ssl.CERT_NONE}   # required for rediss://
CELERY_REDIS_BACKEND_USE_SSL = {"ssl_cert_reqs": ssl.CERT_NONE}
CELERY_TASK_SERIALIZER       = "json"
CELERY_RESULT_SERIALIZER     = "json"
CELERY_ACCEPT_CONTENT        = ["json"]
CELERY_TASK_TRACK_STARTED    = True
CELERY_TASK_ALWAYS_EAGER     = os.getenv("CELERY_ALWAYS_EAGER", "False") == "True"
# ^ set CELERY_ALWAYS_EAGER=True in .env for tests — runs tasks synchronously


# ── Hugging Face Spaces (inference API) ───────────────────────────────────────
# Deploy your trained models as Gradio Spaces on https://huggingface.co/spaces
# and paste the Space URLs + your HF read token here.
HF_SPACE_NAME    = os.getenv("HF_SPACE_NAME", "")     # e.g. "smartCivic/smartcivic-ai"
HF_API_TOKEN     = os.getenv("HF_API_TOKEN", "")      # hf_xxxx (free read token)
HF_NLP_TOKEN     = os.getenv("HF_NLP_TOKEN", "") or HF_API_TOKEN
# Legacy — kept so nothing else breaks if still referenced
HF_NLP_API_URL   = os.getenv("HF_NLP_API_URL", "")
HF_IMAGE_API_URL = os.getenv("HF_IMAGE_API_URL", "")

