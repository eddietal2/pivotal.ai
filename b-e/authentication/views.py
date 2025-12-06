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
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
import jwt

# Custom Magic Link Token
class MagicLinkToken(Token):
    """Custom JWT token for magic link authentication"""
    token_type = 'magic_link'
    lifetime = timedelta(minutes=10)

# Custom Session Token with longer lifetime
class SessionToken(Token):
    """Custom JWT token for authenticated sessions"""
    token_type = 'access'
    lifetime = timedelta(hours=24)  # 24 hour session

# Custom JWT Authentication that accepts our SessionToken
class CustomJWTAuthentication(JWTAuthentication):
    """Custom JWT authentication that works with SessionToken"""
    
    def get_validated_token(self, raw_token):
        """Override to add debug logging and handle custom token types"""
        print(f"{custom_console.COLOR_CYAN}CustomJWTAuthentication validating token{custom_console.RESET_COLOR}")
        
        try:
            # Decode without verification first to see what's in it
            unverified = jwt.decode(raw_token, options={'verify_signature': False})
            print(f"  Token claims (unverified): {unverified}")
            
            # Now validate properly
            validated_token = super().get_validated_token(raw_token)
            print(f"  Token validation: SUCCESS")
            return validated_token
            
        except TokenError as e:
            print(f"  Token validation: FAILED - {e}")
            raise
        except Exception as e:
            print(f"  Token validation: ERROR - {e}")
            raise InvalidToken(str(e))
    
    def get_user(self, validated_token):
        """Override to use our custom User model"""
        try:
            user_id = validated_token.get('user_id')
            if user_id is None:
                raise InvalidToken('Token has no user_id claim')
            
            # Use our custom User model from authentication app
            user = User.objects.filter(id=user_id, is_deleted=False).first()
            
            if user is None:
                raise InvalidToken('User not found or deleted')
            
            print(f"  User found: {user.email}")
            return user
            
        except User.DoesNotExist:
            raise InvalidToken('User not found')
        except Exception as e:
            print(f"  Error getting user: {e}")
            raise InvalidToken(str(e))

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
    
    # Handle GET request - Verify magic link token
    if request.method == "GET":
        token_string = request.GET.get('token')
        
        if not token_string:
            return JsonResponse({
                'status': 'error',
                'message': 'Token parameter is missing'
            }, status=400)
        
        try:
            # Decode and validate the token
            from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
            
            token = MagicLinkToken(token_string)
            
            # Extract user info from token
            user_id = token.get('user_id')
            email = token.get('email')
            
            if not user_id or not email:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid token payload'
                }, status=400)
            
            # Verify user exists
            user = User.objects.filter(id=user_id, email=email).first()
            
            if not user:
                return JsonResponse({
                    'status': 'error',
                    'message': 'User not found'
                }, status=404)
            
            # Generate a new access token for the authenticated session
            # Using our custom SessionToken class with 24 hour expiry
            session_token = SessionToken()
            session_token['user_id'] = user.id
            session_token['email'] = user.email
            
            # Debug: Print token expiry
            import time
            current_timestamp = int(time.time())
            token_exp = session_token['exp']
            print(f"{custom_console.COLOR_GREEN}Session token created:{custom_console.RESET_COLOR}")
            print(f"  Token type: {session_token.token_type}")
            print(f"  Lifetime: {session_token.lifetime}")
            print(f"  Expires at (timestamp): {token_exp}")
            print(f"  Current time (timestamp): {current_timestamp}")
            print(f"  Time until expiry: {token_exp - current_timestamp} seconds ({(token_exp - current_timestamp) / 3600} hours)")
            
            # Redirect to frontend with tokens in URL (will be stored by frontend)
            frontend_url = (
                f"http://192.168.1.68:3000/login?"
                f"token={str(session_token)}&"
                f"email={email}&"
                f"user_id={user.id}&"
                f"first_name={user.first_name or ''}"
            )
            
            # Redirect user to frontend
            return redirect(frontend_url)
            
        except (TokenError, InvalidToken) as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Invalid or expired token: {str(e)}'
            }, status=401)
        except Exception as e:
            print(f"Error verifying magic link: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    # Handle POST request - Send magic link email
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
def change_email(request):
    # Manually authenticate using our custom authentication class
    auth = CustomJWTAuthentication()
    
    try:
        # This will print debug info from our custom auth class
        user_auth_tuple = auth.authenticate(request)
        
        if user_auth_tuple is None:
            print(f"{custom_console.COLOR_RED}Authentication returned None{custom_console.RESET_COLOR}")
            return JsonResponse({'status': 'error', 'message': 'Authentication failed'}, status=401)
        
        user, token = user_auth_tuple
        print(f"{custom_console.COLOR_GREEN}Authentication successful: {user}{custom_console.RESET_COLOR}")
        
    except Exception as e:
        print(f"{custom_console.COLOR_RED}Authentication error: {e}{custom_console.RESET_COLOR}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=401)
    
    print(f"{custom_console.COLOR_YELLOW}change_email view called {custom_console.RESET_COLOR}")
    
    if request.method == "PUT":
        # Use the authenticated user from our custom auth (not request.user which is AnonymousUser)
        # 'user' variable is already set from the authentication above
        
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
        
        # Validation: Check email format
        import re
        email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(email_regex, new_email):
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid email format.'
            }, status=400)
        
        # Validation: Check if new email already exists for a different user
        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return JsonResponse({
                'status': 'error',
                'message': f'Email "{new_email}" is already in use by another account.'
            }, status=409)
        
        try:
            # Generate verification token with user_id and new_email
            from itsdangerous import URLSafeTimedSerializer
            serializer = URLSafeTimedSerializer(settings.SECRET_KEY)
            
            verification_data = {
                'user_id': user.id,
                'old_email': user.email,
                'new_email': new_email
            }
            
            verification_token = serializer.dumps(verification_data, salt='email-change')
            
            # Build verification URL
            verification_url = f"http://127.0.0.1:8000/auth/settings/email/verify?token={verification_token}"
            
            # Send verification email to the NEW email address
            email_subject = 'Verify Your Email Change'
            email_body = f"""
            Hi {user.first_name or 'there'},
            
            You requested to change your email address from {user.email} to {new_email}.
            
            Please click the link below to verify your new email address:
            {verification_url}
            
            This link will expire in 1 hour.
            
            If you didn't request this change, please ignore this email.
            
            Best regards,
            The Pivotal AI Team
            """
            
            # Send the email
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=getenv('EMAIL_HOST_USER'),
                recipient_list=[new_email],  # Send to NEW email
                fail_silently=False,
            )
            
            print(f"{custom_console.COLOR_GREEN}Verification email sent to {new_email}{custom_console.RESET_COLOR}")
            
            # DO NOT update the email yet - wait for verification
            return JsonResponse({
                'status': 'success',
                'message': f'Verification email sent to {new_email}. Please check your inbox and click the verification link.'
            }, status=200)
        
        except SMTPException as e:
            print(f"{custom_console.COLOR_RED}Failed to send verification email: {e}{custom_console.RESET_COLOR}")
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to send verification email. Please try again later.'
            }, status=500)
        
        except Exception as e:
            print(f"Error initiating email change: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Server error: {e}'
            }, status=500)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method. Only PUT requests are allowed.'
    }, status=405)

@csrf_exempt
@api_view(['GET'])
def verify_email_change(request):
    """
    Verify email change using a time-limited token from email link.
    Expected query parameter: token
    After verification, issues new JWT and redirects to frontend.
    """
    print(f"{custom_console.COLOR_YELLOW}verify_email_change view called {custom_console.RESET_COLOR}")
    
    if request.method == "GET":
        # Get token from query parameters
        token = request.GET.get('token')
        
        if not token:
            return JsonResponse({
                'status': 'error',
                'message': 'Verification token is required.'
            }, status=400)
        
        try:
            # Validate and decode the token
            from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
            serializer = URLSafeTimedSerializer(settings.SECRET_KEY)
            
            # Decode token with max age of 1 hour (3600 seconds)
            data = serializer.loads(token, salt='email-change', max_age=3600)
            
            # Extract data from token
            user_id = data.get('user_id')
            old_email = data.get('old_email')
            new_email = data.get('new_email')
            
            if not user_id or not new_email:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid token data.'
                }, status=400)
            
            # Get user by ID and verify old email matches
            user = User.objects.filter(id=user_id, email=old_email, is_deleted=False).first()
            
            if not user:
                return JsonResponse({
                    'status': 'error',
                    'message': 'User not found or email already changed.'
                }, status=404)
            
            # Check if new email is already taken by another user
            if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': f'Email "{new_email}" is already in use by another account.'
                }, status=409)
            
            # Update user's email in database
            user.email = new_email
            user.save()
            
            print(f"{custom_console.COLOR_GREEN}Email changed from {old_email} to {new_email}{custom_console.RESET_COLOR}")
            
            # Generate NEW session token with updated email
            session_token = SessionToken()
            session_token['user_id'] = user.id
            session_token['email'] = user.email  # Updated email
            
            # Redirect to frontend with new token and updated user data
            frontend_url = (
                f"http://192.168.1.68:3000/settings?"
                f"token={str(session_token)}&"
                f"email={user.email}&"
                f"user_id={user.id}&"
                f"first_name={user.first_name or ''}&"
                f"email_updated=true"
            )
            
            return redirect(frontend_url)
            
        except SignatureExpired:
            return JsonResponse({
                'status': 'error',
                'message': 'Verification token has expired. Please request a new email change.'
            }, status=400)
        except (BadSignature, Exception) as e:
            print(f"{custom_console.COLOR_RED}Error verifying email change: {e}{custom_console.RESET_COLOR}")
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid or malformed verification token.'
            }, status=400)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method. Only GET requests are allowed.'
    }, status=405)

@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Delete the authenticated user's account.
    Requires authentication.
    """
    print(f"{custom_console.COLOR_YELLOW}delete_account view called {custom_console.RESET_COLOR}")
    
    if request.method == "DELETE":
        # Get the authenticated user
        user = request.user
        
        try:
            # Store user email for response message
            user_email = user.email
            user_id = user.id
            
            # Soft delete: set is_deleted flag instead of hard delete
            user.is_deleted = True
            user.save()
            
            return JsonResponse({
                'status': 'success',
                'message': f'Account for user ID {user_id} ({user_email}) has been successfully deleted.'
            }, status=204)
            
        except Exception as e:
            print(f"Error deleting account: {e}")
            return JsonResponse({
                'status': 'error',
                'message': f'Server error: {e}'
            }, status=500)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method. Only DELETE requests are allowed.'
    }, status=405)


