from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
import json
from .services import FinancialDataService

@require_GET
def get_financial_data(request):
    """
    API endpoint to fetch financial data for a ticker.
    
    Query params:
    - ticker: The ticker symbol (required)
    - type: 'price' for latest price, 'rv' for relative volume (default: 'price')
    """
    print("get_financial_data called")
    ticker = request.GET.get('ticker')
    data_type = request.GET.get('type', 'price')
    
    print(f"Ticker: {ticker}, Type: {data_type}")
    
    if not ticker:
        return JsonResponse({'error': 'Ticker parameter is required'}, status=400)
    
    service = FinancialDataService()
    
    try:
        print("Calling service method")
        if data_type == 'price':
            data = service.fetch_data(ticker)
        elif data_type == 'rv':
            data = service.fetch_relative_volume(ticker)
        else:
            return JsonResponse({'error': 'Invalid type parameter. Use "price" or "rv"'}, status=400)
        
        print("Service call successful")
        return JsonResponse(data)
    except ValueError as e:
        print(f"ValueError: {e}")
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        print(f"Unexpected error: {e}")
        return JsonResponse({'error': f'Unexpected error: {str(e)}'}, status=500)
