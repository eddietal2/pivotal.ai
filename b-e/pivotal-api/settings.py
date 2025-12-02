from pathlib import Path
from decouple import config # Import config from python-decouple
import dj_database_url # Import the database URL utility
import os # Required for setting environment variables in production configuration

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# --- CRITICAL FIX 1: Load SECRET_KEY securely from environment ---
# SECURITY WARNING: keep the secret key used in production secret!
# The hardcoded value has been removed and now relies entirely on the .env file or Vercel environment.
SECRET_KEY = config('SECRET_KEY')

# --- SECURITY WARNING: don't run with debug turned on in production! ---
# Load DEBUG status from environment, default to True for local development
DEBUG = config('DEBUG', default=True, cast=bool)

# ----------------------------------------------------------------------
# PRODUCTION HOSTS AND SECURITY
# ----------------------------------------------------------------------
if DEBUG:
    # Local development: Only allow local hosts
    ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
else:
    # Production: Use '*' to allow Vercel or your specific domain names
    # SECURITY WARNING: Replace '*' with your actual domain names when possible
    ALLOWED_HOSTS = ['*'] 

    # Enforce production security best practices for Vercel/Neon deployment
    SECURE_SSL_REDIRECT = True # Redirects all non-HTTPS requests to HTTPS
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Configure Static files handling for production (e.g., Vercel)
    # COLLECTFAST is often used here, but for simplicity, we'll keep the static URL path consistent.
    # Set to a temporary path or an external storage URL if using S3/Cloud Storage
    # We will assume Vercel handles static collection or it is not needed yet.

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Add your custom apps here
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# --- FIX 2: Replace Hyphen with Underscore for Python Import Consistency ---
ROOT_URLCONF = 'pivotal-api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                # Note: 'django.template.context_processors.debug' was correctly added here
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# --- FIX 3: Replace Hyphen with Underscore for Python Import Consistency ---
WSGI_APPLICATION = 'pivotal-api.wsgi.application'

# ----------------------------------------------------------------------
# DATABASE CONFIGURATION (PostgreSQL via Neon/Vercel)
# ----------------------------------------------------------------------
if DEBUG:
    # Use SQLite for local development when DEBUG is True 
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # Use the DATABASE_URL environment variable for production (e.g., Vercel)
    DATABASES = {
        'default': dj_database_url.config(
            # Using the primary DATABASE_URL from the .env file
            default=config('DATABASE_URL'), 
            conn_max_age=600,
            ssl_require=True # Neon requires SSL
        )
    }
# ----------------------------------------------------------------------


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'