from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
import json
from .services import FinancialDataService, fetch_all_tickers_batch


@require_http_methods(["GET", "OPTIONS"])
def market_data(request):
    """
    API endpoint to fetch market data for multiple tickers.
    
    Query params:
    - tickers: Comma-separated list of ticker symbols (required)
    """
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    print("market_data called")
    tickers_param = request.GET.get('tickers')
    
    if not tickers_param:
        return JsonResponse({'error': 'Tickers parameter is required'}, status=400)
    
    tickers = [t.strip() for t in tickers_param.split(',') if t.strip()]
    if not tickers:
        return JsonResponse({'error': 'No valid tickers provided'}, status=400)
    
    # Use batch fetch for all tickers at once - MUCH faster!
    import time
    start_time = time.time()
    result = fetch_all_tickers_batch(tickers)
    elapsed = time.time() - start_time
    print(f"market_data completed in {elapsed:.2f}s")
    
    response = JsonResponse(result)
    response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response
