"""
URL configuration for the authentication app.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path

from . import views

urlpatterns = [

    # User Registration and Retrieval URLs
    path("", views.save_user, name="register"),
    path("user", views.get_user, name="get_user"),

    # Mafic Link URLs
    path("magic-link", views.send_magic_link_email, name="send_magic_link"),
    path("magic-link-token", views.generate_magic_link_token, name="generate_magic_link_token"),

    # Google OAuth URLs
    path("google-oauth", views.google_oauth_redirect, name="google_oauth_redirect"),
    path("google-callback", views.google_oauth_callback, name="google_oauth_callback"),

    # Settings Page URLs``
    path("settings/email", views.change_email, name="change_email"),
    path("settings/email/verify", views.verify_email_change, name="change_email_verification"),

    # Example URL patterns for reference
    # path("articles/<int:year>/", views.year_archive),
    # path("articles/<int:year>/<int:month>/", views.month_archive),
    # path("articles/<int:year>/<int:month>/<slug:slug>/", views.article_detail),
]