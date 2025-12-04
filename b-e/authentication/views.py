from django.http import HttpResponse, JsonResponse # New import for API responses
from django.views.decorators.csrf import csrf_exempt
import json
from .models import User

# The @csrf_exempt decorator tells Django to skip the CSRF check for this specific view.
# This is being used with POSTMAN requests for testing purposes.
@csrf_exempt
def save_user(request):
    if request.method == "POST":
        email = None
        first_name = None
        
        # 1. Default data source is request.POST (for form-urlencoded/form-data)
        # This handles Postman requests set to 'x-www-form-urlencoded' or 'form-data'
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
def send_magic_link_email(request):
    print("send_magic_link_email view called")
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
        
        try:
            # Here you would implement the logic to send the magic link email.
            # For demonstration, we'll just print to console.
            print(f"Sending magic link to {email}")
            
            return JsonResponse({
                'status': 'success',
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
def google_oauth_redirect(request):
    print("google_oauth_redirect view called")
    return HttpResponse("This is a placeholder response for google_oauth_redirect view.")