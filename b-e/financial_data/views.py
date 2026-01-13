from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
import json
from .services import FinancialDataService, fetch_all_tickers_batch, fetch_stock_detail


@require_http_methods(["GET", "OPTIONS"])
def search_stocks(request):
    """
    API endpoint to search for stocks/ETFs/crypto by symbol or name.
    
    Query params:
    - q: Search query (required, min 1 character)
    """
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    query = request.GET.get('q', '').strip()
    
    if len(query) < 1:
        return JsonResponse({'results': []})
    
    import yfinance as yf
    
    results = []
    
    try:
        # Use yfinance search functionality
        # First, try to get info for the exact symbol (case insensitive)
        try:
            ticker = yf.Ticker(query.upper())
            info = ticker.info
            if info and info.get('symbol'):
                # Determine the type
                quote_type = info.get('quoteType', 'EQUITY')
                type_map = {
                    'EQUITY': 'Stock',
                    'ETF': 'ETF',
                    'MUTUALFUND': 'Mutual Fund',
                    'CRYPTOCURRENCY': 'Crypto',
                    'CURRENCY': 'Currency',
                    'INDEX': 'Index',
                    'FUTURE': 'Futures',
                }
                asset_type = type_map.get(quote_type, 'Stock')
                
                results.append({
                    'symbol': info.get('symbol'),
                    'name': info.get('shortName') or info.get('longName') or info.get('symbol'),
                    'type': asset_type,
                    'exchange': info.get('exchange', ''),
                })
        except Exception as e:
            print(f"Direct lookup failed: {e}")
        
        # Also search using yfinance's search (if available) or use a broader approach
        # yfinance doesn't have built-in search, so we'll use a workaround with popular tickers
        
        # Common stocks/ETFs to search through for partial matches
        common_symbols = {
            # Tech giants
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc. Class A',
            'GOOG': 'Alphabet Inc. Class C',
            'MSFT': 'Microsoft Corporation',
            'AMZN': 'Amazon.com Inc.',
            'META': 'Meta Platforms Inc.',
            'TSLA': 'Tesla Inc.',
            'NVDA': 'NVIDIA Corporation',
            'AMD': 'Advanced Micro Devices',
            'INTC': 'Intel Corporation',
            'CRM': 'Salesforce Inc.',
            'ORCL': 'Oracle Corporation',
            'ADBE': 'Adobe Inc.',
            'NFLX': 'Netflix Inc.',
            'PYPL': 'PayPal Holdings',
            'SHOP': 'Shopify Inc.',
            'SQ': 'Block Inc.',
            'UBER': 'Uber Technologies',
            'LYFT': 'Lyft Inc.',
            'SNAP': 'Snap Inc.',
            'PINS': 'Pinterest Inc.',
            'TWTR': 'Twitter Inc.',
            'SPOT': 'Spotify Technology',
            'ZM': 'Zoom Video Communications',
            'DOCU': 'DocuSign Inc.',
            'CRWD': 'CrowdStrike Holdings',
            'PLTR': 'Palantir Technologies',
            'SNOW': 'Snowflake Inc.',
            'COIN': 'Coinbase Global',
            'RBLX': 'Roblox Corporation',
            'U': 'Unity Software',
            'PATH': 'UiPath Inc.',
            'AI': 'C3.ai Inc.',
            'DDOG': 'Datadog Inc.',
            'MDB': 'MongoDB Inc.',
            'NET': 'Cloudflare Inc.',
            'OKTA': 'Okta Inc.',
            'TEAM': 'Atlassian Corporation',
            'NOW': 'ServiceNow Inc.',
            'WDAY': 'Workday Inc.',
            
            # Finance
            'JPM': 'JPMorgan Chase & Co.',
            'BAC': 'Bank of America Corp.',
            'WFC': 'Wells Fargo & Co.',
            'C': 'Citigroup Inc.',
            'GS': 'Goldman Sachs Group',
            'MS': 'Morgan Stanley',
            'V': 'Visa Inc.',
            'MA': 'Mastercard Inc.',
            'AXP': 'American Express',
            'BLK': 'BlackRock Inc.',
            'SCHW': 'Charles Schwab',
            'USB': 'U.S. Bancorp',
            'PNC': 'PNC Financial Services',
            'TFC': 'Truist Financial',
            'COF': 'Capital One Financial',
            
            # Healthcare
            'JNJ': 'Johnson & Johnson',
            'UNH': 'UnitedHealth Group',
            'PFE': 'Pfizer Inc.',
            'MRK': 'Merck & Co.',
            'ABBV': 'AbbVie Inc.',
            'LLY': 'Eli Lilly and Co.',
            'TMO': 'Thermo Fisher Scientific',
            'ABT': 'Abbott Laboratories',
            'BMY': 'Bristol-Myers Squibb',
            'AMGN': 'Amgen Inc.',
            'GILD': 'Gilead Sciences',
            'MDT': 'Medtronic PLC',
            'CVS': 'CVS Health Corp.',
            'MRNA': 'Moderna Inc.',
            'BNTX': 'BioNTech SE',
            
            # Consumer
            'WMT': 'Walmart Inc.',
            'HD': 'Home Depot Inc.',
            'PG': 'Procter & Gamble Co.',
            'KO': 'Coca-Cola Co.',
            'PEP': 'PepsiCo Inc.',
            'COST': 'Costco Wholesale',
            'NKE': 'Nike Inc.',
            'MCD': 'McDonald\'s Corp.',
            'SBUX': 'Starbucks Corp.',
            'TGT': 'Target Corp.',
            'LOW': 'Lowe\'s Companies',
            'DIS': 'Walt Disney Co.',
            'CMCSA': 'Comcast Corp.',
            'ABNB': 'Airbnb Inc.',
            
            # Energy
            'XOM': 'Exxon Mobil Corp.',
            'CVX': 'Chevron Corp.',
            'COP': 'ConocoPhillips',
            'OXY': 'Occidental Petroleum',
            'SLB': 'Schlumberger Ltd.',
            'EOG': 'EOG Resources',
            'MPC': 'Marathon Petroleum',
            'VLO': 'Valero Energy',
            'PSX': 'Phillips 66',
            
            # Industrial
            'CAT': 'Caterpillar Inc.',
            'DE': 'Deere & Co.',
            'BA': 'Boeing Co.',
            'HON': 'Honeywell International',
            'UPS': 'United Parcel Service',
            'FDX': 'FedEx Corp.',
            'LMT': 'Lockheed Martin',
            'RTX': 'RTX Corporation',
            'GE': 'General Electric',
            'MMM': '3M Company',
            'UNP': 'Union Pacific',
            
            # Telecom
            'T': 'AT&T Inc.',
            'VZ': 'Verizon Communications',
            'TMUS': 'T-Mobile US',
            
            # ETFs
            'SPY': 'SPDR S&P 500 ETF Trust',
            'QQQ': 'Invesco QQQ Trust',
            'IWM': 'iShares Russell 2000 ETF',
            'DIA': 'SPDR Dow Jones Industrial Average ETF',
            'VTI': 'Vanguard Total Stock Market ETF',
            'VOO': 'Vanguard S&P 500 ETF',
            'VXX': 'iPath Series B S&P 500 VIX Short-Term Futures ETN',
            'ARKK': 'ARK Innovation ETF',
            'ARKG': 'ARK Genomic Revolution ETF',
            'ARKF': 'ARK Fintech Innovation ETF',
            'XLF': 'Financial Select Sector SPDR Fund',
            'XLK': 'Technology Select Sector SPDR Fund',
            'XLE': 'Energy Select Sector SPDR Fund',
            'XLV': 'Health Care Select Sector SPDR Fund',
            'XLI': 'Industrial Select Sector SPDR Fund',
            'XLP': 'Consumer Staples Select Sector SPDR Fund',
            'XLY': 'Consumer Discretionary Select Sector SPDR Fund',
            'XLB': 'Materials Select Sector SPDR Fund',
            'XLU': 'Utilities Select Sector SPDR Fund',
            'XLRE': 'Real Estate Select Sector SPDR Fund',
            'GLD': 'SPDR Gold Trust',
            'SLV': 'iShares Silver Trust',
            'USO': 'United States Oil Fund',
            'TLT': 'iShares 20+ Year Treasury Bond ETF',
            'HYG': 'iShares iBoxx $ High Yield Corporate Bond ETF',
            'LQD': 'iShares iBoxx $ Investment Grade Corporate Bond ETF',
            'EEM': 'iShares MSCI Emerging Markets ETF',
            'EFA': 'iShares MSCI EAFE ETF',
            'VWO': 'Vanguard FTSE Emerging Markets ETF',
            'VEA': 'Vanguard FTSE Developed Markets ETF',
            'IEMG': 'iShares Core MSCI Emerging Markets ETF',
            'VNQ': 'Vanguard Real Estate ETF',
            'SCHD': 'Schwab U.S. Dividend Equity ETF',
            'JEPI': 'JPMorgan Equity Premium Income ETF',
            'SMH': 'VanEck Semiconductor ETF',
            'SOXX': 'iShares Semiconductor ETF',
            'IBB': 'iShares Biotechnology ETF',
            'XBI': 'SPDR S&P Biotech ETF',
            
            # Crypto
            'BTC-USD': 'Bitcoin USD',
            'ETH-USD': 'Ethereum USD',
            'SOL-USD': 'Solana USD',
            'XRP-USD': 'XRP USD',
            'ADA-USD': 'Cardano USD',
            'DOGE-USD': 'Dogecoin USD',
            'AVAX-USD': 'Avalanche USD',
            'DOT-USD': 'Polkadot USD',
            'MATIC-USD': 'Polygon USD',
            'LINK-USD': 'Chainlink USD',
            'ATOM-USD': 'Cosmos USD',
            'UNI-USD': 'Uniswap USD',
            'LTC-USD': 'Litecoin USD',
            
            # Indices (for reference)
            '^GSPC': 'S&P 500 Index',
            '^DJI': 'Dow Jones Industrial Average',
            '^IXIC': 'NASDAQ Composite',
            '^RUT': 'Russell 2000 Index',
            '^VIX': 'CBOE Volatility Index',
            
            # Commodities
            'GC=F': 'Gold Futures',
            'SI=F': 'Silver Futures',
            'CL=F': 'Crude Oil Futures',
            'NG=F': 'Natural Gas Futures',
            'HG=F': 'Copper Futures',
        }
        
        query_upper = query.upper()
        
        # Search through common symbols
        for symbol, name in common_symbols.items():
            if query_upper in symbol.upper() or query_upper in name.upper():
                # Check if already in results
                if not any(r['symbol'] == symbol for r in results):
                    # Determine type
                    if symbol.endswith('-USD'):
                        asset_type = 'Crypto'
                    elif symbol.startswith('^'):
                        asset_type = 'Index'
                    elif symbol.endswith('=F'):
                        asset_type = 'Futures'
                    elif symbol in ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'VXX', 'GLD', 'SLV', 'USO', 'TLT', 'HYG', 'LQD', 'EEM', 'EFA', 'VWO', 'VEA', 'IEMG', 'VNQ', 'SCHD', 'JEPI', 'SMH', 'SOXX', 'IBB', 'XBI'] or symbol.startswith('XL') or symbol.startswith('ARK'):
                        asset_type = 'ETF'
                    else:
                        asset_type = 'Stock'
                    
                    results.append({
                        'symbol': symbol,
                        'name': name,
                        'type': asset_type,
                    })
        
        # If we don't have many results and query looks like a symbol, try yfinance lookup
        if len(results) < 3 and len(query) <= 6 and query.isalpha():
            for suffix in ['', '-USD']:
                test_symbol = query.upper() + suffix
                if any(r['symbol'] == test_symbol for r in results):
                    continue
                try:
                    ticker = yf.Ticker(test_symbol)
                    info = ticker.info
                    if info and info.get('symbol') and info.get('regularMarketPrice'):
                        quote_type = info.get('quoteType', 'EQUITY')
                        type_map = {
                            'EQUITY': 'Stock',
                            'ETF': 'ETF',
                            'MUTUALFUND': 'Mutual Fund',
                            'CRYPTOCURRENCY': 'Crypto',
                            'CURRENCY': 'Currency',
                            'INDEX': 'Index',
                            'FUTURE': 'Futures',
                        }
                        asset_type = type_map.get(quote_type, 'Stock')
                        
                        results.append({
                            'symbol': info.get('symbol'),
                            'name': info.get('shortName') or info.get('longName') or info.get('symbol'),
                            'type': asset_type,
                            'exchange': info.get('exchange', ''),
                        })
                except Exception:
                    pass
        
        # Sort results: exact symbol matches first, then by symbol length
        def sort_key(r):
            symbol = r['symbol'].upper()
            query_up = query.upper()
            # Exact match gets priority 0
            if symbol == query_up:
                return (0, len(symbol))
            # Starts with query gets priority 1
            if symbol.startswith(query_up):
                return (1, len(symbol))
            # Contains query gets priority 2
            return (2, len(symbol))
        
        results.sort(key=sort_key)
        
        # Limit to 15 results
        results = results[:15]
        
    except Exception as e:
        print(f"Search error: {e}")
        import traceback
        traceback.print_exc()
    
    response = JsonResponse({'results': results})
    response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response


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


@require_http_methods(["GET", "OPTIONS"])
def live_screens(request):
    """
    API endpoint to fetch AI-curated live stock screens.
    
    Query params:
    - categories: Comma-separated list of categories to filter by (optional)
                  Valid: momentum, sector, unusual, technical, value, volatility
    """
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    from .services import LiveScreensService
    
    categories_param = request.GET.get('categories', '')
    categories = [c.strip() for c in categories_param.split(',') if c.strip()] if categories_param else None
    
    print(f"live_screens called with categories: {categories}")
    
    import time
    start_time = time.time()
    
    try:
        service = LiveScreensService()
        screens = service.fetch_live_screens(categories=categories)
        elapsed = time.time() - start_time
        print(f"live_screens completed in {elapsed:.2f}s - returned {len(screens)} screens")
        
        response = JsonResponse({'screens': screens})
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
        
    except Exception as e:
        print(f"Error fetching live screens: {e}")
        response = JsonResponse({'error': str(e), 'screens': []}, status=500)
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
