from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from .services import FinancialDataService

def fetch_ticker_data(ticker):
    service = FinancialDataService()
    try:
        print(f"Fetching data for {ticker}")
        # Get intraday data for sparkline and latest close
        data = service.fetch_data(ticker)
        
        # Get RV
        try:
            rv_info = service.fetch_relative_volume(ticker)
            rv = rv_info.get('daily_rv', None)
            rv_grade = rv_info.get('daily_grade', None)
        except Exception:
            rv = None
            rv_grade = None
        
        # Sparkline: now contains 24 hours of data from the service
        sparkline = data.get('closes', [])
        
        return ticker, {
            'close': round(data['latest']['close'], 2) if data.get('latest') else None,
            'change': data['latest'].get('change', 0.0) if data.get('latest') else 0.0,
            'sparkline': sparkline,
            'is_after_hours': data['latest'].get('is_after_hours', False) if data.get('latest') else False,
            'rv': rv,
            'rv_grade': rv_grade
        }
    except Exception as e:
        return ticker, {'error': str(e)}

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
    
    result = {}
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_ticker_data, ticker): ticker for ticker in tickers}
        for future in as_completed(futures):
            ticker, data = future.result()
            result[ticker] = data
    
    print("market_data completed")
    response = JsonResponse(result)
    response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response
