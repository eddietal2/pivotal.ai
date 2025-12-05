from django.http import HttpResponse, JsonResponse # New import for API responses
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.mail import send_mail
import json
from .models import User
import custom_console

from rest_framework_simplejwt.tokens import Token
from rest_framework_simplejwt.settings import api_settings
from datetime import datetime, timedelta

# Custom Magic Link Token
class MagicLinkToken(Token):
    """Custom JWT token for magic link authentication"""
    token_type = 'magic_link'
    lifetime = timedelta(minutes=10)

# The @csrf_exempt decorator tells Django to skip the CSRF check for this specific view.
# This is being used with POSTMAN requests for testing purposes.
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
            message = (
                "Use the link below to sign in. This link expires in 10 minutes.\n\n"
                f"{magic_link_url}\n\n"
                "If you did not request this, you can ignore this email."
            )
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com")

            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[email],
                fail_silently=False,
            )
            
            print(f"Sent magic link email to {email}")
            
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
    
@csrf_exempt
def google_oauth_redirect(request):
    print(f"{custom_console.COLOR_YELLOW}google_oauth_redirect view called {custom_console.RESET_COLOR}")
    return HttpResponse("This is a placeholder response for google_oauth_redirect view.")

