from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, JsonResponse # New import for API responses
import custom_console

@csrf_exempt
def wassup_world(request):
    print(f"{custom_console.COLOR_YELLOW}wassup_world view called {custom_console.RESET_COLOR}")
    return HttpResponse("Wassup, World!")