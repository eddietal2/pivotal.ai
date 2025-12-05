from django.http import HttpResponse, JsonResponse # New import for API responses
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import redirect
from os import getenv
from urllib.parse import urlencode
from smtplib import SMTPException
import json
import requests
from .models import User
import custom_console

from rest_framework_simplejwt.tokens import Token
from rest_framework_simplejwt.settings import api_settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta

# Custom Magic Link Token
class MagicLinkToken(Token):
    """Custom JWT token for magic link authentication"""
    token_type = 'magic_link'
    lifetime = timedelta(minutes=10)

# The @csrf_exempt decorator tells Django to skip the CSRF check for this specific view.
# This is being used with POSTMAN requests for testing purposes.

# // ----------------------------
# User Registration and Retrieval Views
# // ----------------------------   
@csrf_exempt
def save_user(request):
    print(f"{custom_console.COLOR_YELLOW}save_user view {custom_console.RESET_COLOR}")

    if request.method == "POST":
        email = None
        first_name = None
        # 1. Default data source is request.POST (for form-urlencoded/form-data)
        data = request.POST
        
        if data:
            email = data.get("email")
            first_name = data.get("first_name")
        
        # 2. If data is still missing, manually parse request.body as JSON
        # This handles Postman requests set to 'raw' and JSON type
        if not email and request.body:
            try:
                # Decode the request body from bytes, then parse the JSON string
                json_data = json.loads(request.body.decode('utf-8'))
                email = json_data.get("email")
                first_name = json_data.get("first_name")
            except json.JSONDecodeError:
                # If JSON parsing fails, we continue with the None values
                pass 

        # Validation Check: Ensure required data is present
        if not email or not first_name:
            return JsonResponse({
                'status': 'error',
                'message': 'Required fields missing: "email" and "first_name". Ensure Postman body is correctly configured (x-www-form-urlencoded or raw JSON).'
            }, status=400) # HTTP 400 Bad Request
        
        try:
            # Create and save the user
            user = User(email=email, first_name=first_name)
            user.save()
            
            # Respond with success and the created object data
            return JsonResponse({
                'status': 'success',
                'message': 'User created successfully.',
                'user_id': user.pk,
                'email': user.email,
                'first_name': user.first_name
            }, status=201) # HTTP 201 Created
            
        except Exception as e:
            # Handle database saving errors (IntegrityError, etc.)
            print(f"Error saving user: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Database or server error: {e}'
            }, status=500) # HTTP 500 Internal Server Error
    
    # Handle requests that are not POST (e.g., GET, PUT, DELETE)
    return JsonResponse({
        'status': 'error',
        'message': 'Method not allowed. Use POST to save a user.'
    }, status=405) # HTTP 405 Method Not Allowed

@csrf_exempt
def get_user(request):
    print(f"{custom_console.COLOR_YELLOW}get_user view called {custom_console.RESET_COLOR}")
    
    if request.method == "POST":
        email = None
        
        # 1. Try to get email from request.POST (form-urlencoded/form-data)
        data = request.POST
        if data:
            email = data.get("email")
        
        # 2. If email is missing, manually parse request.body as JSON
        if not email and request.body:
            try:
                json_data = json.loads(request.body.decode('utf-8'))
                email = json_data.get("email")
            except json.JSONDecodeError:
                pass
        
        # Validation: Ensure email is provided
        if not email:
            return JsonResponse({
                'status': 'error',
                'message': 'Required field missing: "email".'
            }, status=400)  # HTTP 400 Bad Request
        
        try:
            # Query the user by email using filter() instead of all()
            user = User.objects.filter(email=email).first()
            
            if user:
                # User found: return user details
                return JsonResponse({
                    'status': 'success',
                    'user_id': user.pk,
                    'email': user.email,
                    'first_name': user.first_name
                }, status=200)  # HTTP 200 OK
            else:
                # User not found
                return JsonResponse({
                    'status': 'error',
                    'message': f'User with email "{email}" not found.'
                }, status=404)  # HTTP 404 Not Found
                
        except Exception as e:
            print(f"Error retrieving user: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Server error: {e}'
            }, status=500)  # HTTP 500 Internal Server Error
    
    # Handle non-POST requests
    return JsonResponse({
        'status': 'error',
        'message': 'Method not allowed. Use POST to retrieve a user.'
    }, status=405)  # HTTP 405 Method Not Allowed

# // ----------------------------
# Magic Link Views 
# // ----------------------------   
@csrf_exempt
def send_magic_link_email(request):
    print(f"{custom_console.COLOR_YELLOW}send_magic_link_email view {custom_console.RESET_COLOR}")
    # return HttpResponse("This is a placeholder response for send_magic_link_email view.") 
    if request.method == "POST":
        email = None
        
        # 1. Default data source is request.POST (for form-urlencoded/form-data)
        data = request.POST
        
        if data:
            email = data.get("email")
        
        # 2. If data is still missing, manually parse request.body as JSON
        if not email and request.body:
            try:
                json_data = json.loads(request.body.decode('utf-8'))
                email = json_data.get("email")
            except json.JSONDecodeError:
                pass 

        # Validation Check: Ensure email is present
        if not email:
            return JsonResponse({
                'status': 'error',
                'code': 400,
                'message': 'Required field missing: email'
            }, status=400) # HTTP 400 Bad Request
        
        # Email Format Validation (simple regex check)
        import re
        email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(email_regex, email):
            return JsonResponse({
                'status': 'error',
                'code': 400,
                'message': 'Invalid email format'
            }, status=400) # HTTP 400 Bad Request
        
        try:
            # Look up the user by email
            user = User.objects.filter(email=email).first()
            
            if not user:
                # User not found
                return JsonResponse({
                    'status': 'error',
                    'message': f'User with email "{email}" not found.'
                }, status=404)  # HTTP 404 Not Found
            
            # Build a magic link token and send via email
            token = MagicLinkToken()
            token['user_id'] = user.id
            token['email'] = user.email

            magic_link_url = f"http://127.0.0.1:8000/auth/magic-link?token={str(token)}"
            subject = "Your magic sign-in link"
            
            # Plain text version (fallback)
            message = (
                "Use the link below to sign in. This link expires in 10 minutes.\n\n"
                f"{magic_link_url}\n\n"
                "If you did not request this, you can ignore this email."
            )
            
            # HTML version with light/dark mode support
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="color-scheme" content="light dark">
                <meta name="supported-color-schemes" content="light dark">
                <style>
                    :root {{
                        color-scheme: light dark;
                        supported-color-schemes: light dark;
                    }}
                    body {{
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 40px 20px;
                    }}
                    .logo {{
                        text-align: center;
                        margin-bottom: 32px;
                    }}
                    .logo-light {{
                        display: block;
                    }}
                    .logo-dark {{
                        display: none;
                    }}
                    .content {{
                        background: #ffffff;
                        border-radius: 12px;
                        padding: 32px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }}
                    h1 {{
                        color: #1a1a1a;
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0 0 16px 0;
                    }}
                    p {{
                        color: #4a4a4a;
                        font-size: 16px;
                        line-height: 1.6;
                        margin: 0 0 24px 0;
                    }}
                    .button {{
                        display: inline-block;
                        background: #0070f3;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 14px 32px;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 16px;
                        text-align: center;
                    }}
                    .button:hover {{
                        background: #0051cc;
                    }}
                    .footer {{
                        color: #8a8a8a;
                        font-size: 14px;
                        margin-top: 24px;
                        text-align: center;
                    }}
                    .expiry {{
                        color: #666;
                        font-size: 14px;
                        margin-top: 16px;
                    }}
                    
                    /* Dark mode styles */
                    @media (prefers-color-scheme: dark) {{
                        .logo-light {{
                            display: none;
                        }}
                        .logo-dark {{
                            display: block;
                        }}
                        .content {{
                            background: #1a1a1a;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        }}
                        h1 {{
                            color: #ffffff;
                        }}
                        p {{
                            color: #b4b4b4;
                        }}
                        .expiry {{
                            color: #8a8a8a;
                        }}
                        .footer {{
                            color: #666;
                        }}
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="logo">
                        <img src="https://s3.us-east-2.amazonaws.com/pivotal.ai/logo-v1.png" alt="Logo" width="320" class="logo-light">
                        <img src="https://s3.us-east-2.amazonaws.com/pivotal.ai/logo-v1-white.png" alt="Logo" width="320" class="logo-dark">
                    </div>
                    <div class="content">
                        <h1>Your Magic Sign-In Link</h1>
                        <p>Click the button below to securely sign in to your account. No password needed!</p>
                        <p style="text-align: center;">
                            <a href="{magic_link_url}" class="button">Sign In Now</a>
                        </p>
                        <p class="expiry">⏱️ This link expires in 10 minutes for your security.</p>
                        <p class="footer">
                            If you didn't request this link, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            from_email = getattr(settings, "eddie@finalbossxr.com", "eddie@finalbossxr.com")

            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=from_email,
                    recipient_list=[email],
                    fail_silently=False,
                    html_message=html_message,
                )
                print(f"Sent magic link email to {email}")
            except SMTPException as smtp_error:
                print(f"SMTP Error: {smtp_error}")
                return JsonResponse({
                    'status': 'error',
                    'message': f'Email sending failed: {str(smtp_error)}'
                }, status=500)
            except Exception as email_error:
                print(f"Email Error: {email_error}")
                return JsonResponse({
                    'status': 'error',
                    'message': f'Email error: {str(email_error)}'
                }, status=500)
            
            return JsonResponse({
                'status': 'success',
                'magic_link_url': magic_link_url,
                'message': f'Magic link sent to {email}.'
            }, status=200) # HTTP 200 OK
            
        except Exception as e:
            print(f"Error sending magic link: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Server error: {e}'
            }, status=500) # HTTP 500 Internal Server Error
    
    return JsonResponse({
        'status': 'error',
        'message': 'Method not allowed. Use POST to send a magic link.'
    }, status=405) # HTTP 405 Method Not Allowed

@csrf_exempt
def generate_magic_link_token(request):
    print(f"{custom_console.COLOR_YELLOW}generate_magic_link_token view called {custom_console.RESET_COLOR}")
    
    if request.method == "POST":
        user_id = None
        
        # 1. Try to get user_id from request.POST
        data = request.POST
        if data:
            user_id = data.get("id")
        
        # 2. If user_id is missing, manually parse request.body as JSON
        if not user_id and request.body:
            try:
                json_data = json.loads(request.body.decode('utf-8'))
                user_id = json_data.get("id")
            except json.JSONDecodeError:
                pass
        
        # Validation: Ensure user_id is provided
        if not user_id:
            return JsonResponse({
                'status': 'error',
                'message': 'Required field missing: "id".'
            }, status=400)
        
        try:
            # Look up user by ID
            user = User.objects.filter(id=user_id).first()
            if not user:
                return JsonResponse({
                    'status': 'error',
                    'message': f'User with ID "{user_id}" not found.'
                }, status=404)
            
            # Generate magic link token using djangorestframework-simplejwt
            token = MagicLinkToken()
            token['user_id'] = user.id
            token['email'] = user.email
            
            print(f"Generated magic link token for user {user.id}")

            generated_url = f"http://127.0.0.1:8000/auth/magic-link?token={str(token)}"
            
            return JsonResponse({
                'status': 'success',
                'token': str(token),
                'magic_link_url': str(generated_url),
                'user_id': user.id,
                'message': f'Magic link token generated for user ID {user.id}.'
            }, status=200)
        
        except Exception as e:
            print(f"Error generating magic link token: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Server error: {e}'
            }, status=500)
    
    # Handle non-POST requests
    return JsonResponse({
        'status': 'error',
        'message': 'Method not allowed. Use POST to generate a magic link token.'
    }, status=405)

# // ----------------------------
# Google OAuth Views 
# // ----------------------------   
@csrf_exempt
def google_oauth_redirect(request):
    print(f"{custom_console.COLOR_YELLOW}google_oauth_redirect view called {custom_console.RESET_COLOR}")
    
    # Get Google OAuth credentials from settings/environment
    client_id = getenv('GOOGLE_OAUTH_CLIENT_ID', '')
    redirect_uri = getenv('GOOGLE_OAUTH_REDIRECT_URI', 'http://127.0.0.1:8000/auth/google-callback')
    
    if not client_id:
        return JsonResponse({
            'status': 'error',
            'message': 'Google OAuth not configured. GOOGLE_OAUTH_CLIENT_ID missing.'
        }, status=500)
    
    # Build Google OAuth authorization URL
    google_auth_url = 'https://accounts.google.com/o/oauth2/auth'
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
        'prompt': 'consent'
    }
    
    authorization_url = f"{google_auth_url}?{urlencode(params)}"
    
    print(f"Redirecting to Google OAuth: {authorization_url}")
    
    return redirect(authorization_url)

@csrf_exempt
def google_oauth_callback(request):
    print(f"{custom_console.COLOR_YELLOW}google_oauth_callback view called {custom_console.RESET_COLOR}")
    
    # Get the authorization code from the callback URL
    code = request.GET.get('code')
    error = request.GET.get('error')
    
    if error:
        return JsonResponse({
            'status': 'error',
            'message': f'OAuth authorization failed: {error}'
        }, status=400)
    
    if not code:
        return JsonResponse({
            'status': 'error',
            'message': 'Authorization code missing from callback'
        }, status=400)
    
    # Get credentials from environment
    client_id = getenv('GOOGLE_OAUTH_CLIENT_ID', '')
    client_secret = getenv('GOOGLE_OAUTH_CLIENT_SECRET', '')
    redirect_uri = getenv('GOOGLE_OAUTH_REDIRECT_URI', 'http://127.0.0.1:8000/auth/google-callback')
    
    # Exchange authorization code for access token
    token_url = 'https://oauth2.googleapis.com/token'
    token_data = {
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    
    try:
        # Get access token
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()
        token_json = token_response.json()
        access_token = token_json.get('access_token')
        
        if not access_token:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to obtain access token'
            }, status=500)
        
        # Get user info from Google
        userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        userinfo_response.raise_for_status()
        user_info = userinfo_response.json()
        
        print(f"Google user info retrieved: {user_info.get('email')}")
        
        # Return user info to the client
        return JsonResponse({
            'status': 'success',
            'message': 'Google OAuth authentication successful',
            'user_info': {
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'given_name': user_info.get('given_name'),
                'family_name': user_info.get('family_name'),
                'picture': user_info.get('picture'),
                'google_id': user_info.get('id'),
                'verified_email': user_info.get('verified_email')
            }
        }, status=200)
        
    except requests.RequestException as e:
        print(f"Error during Google OAuth: {e}")
        return JsonResponse({
            'status': 'error',
            'message': f'OAuth request failed: {str(e)}'
        }, status=500)   

# // ----------------------------
# Settings Page Views 
# // ----------------------------   
@csrf_exempt
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_email(request):
    print(f"{custom_console.COLOR_YELLOW}change_email view called {custom_console.RESET_COLOR}")
    
    if request.method == "PUT":
        # Get the authenticated user from the request
        user = request.user
        
        # Parse request data
        new_email = None
        
        # Try to get new_email from request.data (DRF handles this)
        if hasattr(request, 'data'):
            new_email = request.data.get("new_email")
        
        # Fallback: manually parse request.body as JSON
        if not new_email and request.body:
            try:
                json_data = json.loads(request.body.decode('utf-8'))
                new_email = json_data.get("new_email")
            except json.JSONDecodeError:
                pass
        
        # Validation: Ensure new_email is provided
        if not new_email:
            return JsonResponse({
                'status': 'error',
                'message': 'Required field missing: "new_email".'
            }, status=400)
        
        try:
            # Update user's email
            user.email = new_email
            user.save()
            
            return JsonResponse({
                'status': 'success',
                'message': f'Email updated successfully for user ID {user.id}.',
                'new_email': user.email
            }, status=200)
        
        except Exception as e:
            print(f"Error changing email: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Server error: {e}'
            }, status=500)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method. Only POST requests are allowed.'
    }, status=405)