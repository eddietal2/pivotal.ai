from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
import json
from .services import FinancialDataService, fetch_all_tickers_batch, fetch_stock_detail


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


@require_http_methods(["GET", "OPTIONS"])
def stock_detail(request):
    """
    API endpoint to fetch detailed stock data for a single ticker.
    
    Query params:
    - symbol: Ticker symbol (required)
    - timeframe: day, week, month, year (optional, default: day)
    """
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    symbol = request.GET.get('symbol')
    timeframe = request.GET.get('timeframe', 'day')
    
    if not symbol:
        return JsonResponse({'error': 'Symbol parameter is required'}, status=400)
    
    print(f"stock_detail called for {symbol} ({timeframe})")
    
    import time
    start_time = time.time()
    result = fetch_stock_detail(symbol, timeframe)
    elapsed = time.time() - start_time
    print(f"stock_detail completed in {elapsed:.2f}s")
    
    if result is None:
        return JsonResponse({'error': f'Failed to fetch data for {symbol}'}, status=404)
    
    response = JsonResponse(result)
    response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response
