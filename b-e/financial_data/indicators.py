"""
Technical Indicators API endpoint for animated charts.
Provides MACD, RSI, Stochastic Oscillator, Moving Averages, and Bollinger Bands data.
"""
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.core.cache import cache
import yfinance as yf
import pandas as pd
import numpy as np
import time

# Simple in-memory cache for rate limiting
_cache = {}
CACHE_DURATION = 60  # Cache for 60 seconds


def calculate_macd(df, fast=12, slow=26, signal=9):
    """Calculate MACD, Signal line, and Histogram"""
    close = df['Close']
    
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    
    return {
        'macd': [round(v, 4) if not pd.isna(v) else 0 for v in macd_line.tolist()],
        'signal': [round(v, 4) if not pd.isna(v) else 0 for v in signal_line.tolist()],
        'histogram': [round(v, 4) if not pd.isna(v) else 0 for v in histogram.tolist()],
        'current': {
            'macd': round(macd_line.iloc[-1], 4) if not pd.isna(macd_line.iloc[-1]) else 0,
            'signal': round(signal_line.iloc[-1], 4) if not pd.isna(signal_line.iloc[-1]) else 0,
            'histogram': round(histogram.iloc[-1], 4) if not pd.isna(histogram.iloc[-1]) else 0,
        }
    }


def calculate_rsi(df, period=14):
    """Calculate Relative Strength Index"""
    close = df['Close']
    delta = close.diff()
    
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    rsi = rsi.fillna(50)
    
    return {
        'rsi': [round(v, 2) if not pd.isna(v) else 50 for v in rsi.tolist()],
        'overbought': 70,
        'oversold': 30,
        'current': round(rsi.iloc[-1], 2) if not pd.isna(rsi.iloc[-1]) else 50,
    }


def calculate_stochastic(df, k_period=14, d_period=3):
    """Calculate Stochastic Oscillator"""
    high = df['High']
    low = df['Low']
    close = df['Close']
    
    lowest_low = low.rolling(window=k_period).min()
    highest_high = high.rolling(window=k_period).max()
    
    k_line = 100 * (close - lowest_low) / (highest_high - lowest_low)
    d_line = k_line.rolling(window=d_period).mean()
    
    k_line = k_line.fillna(50)
    d_line = d_line.fillna(50)
    
    return {
        'k': [round(v, 2) if not pd.isna(v) else 50 for v in k_line.tolist()],
        'd': [round(v, 2) if not pd.isna(v) else 50 for v in d_line.tolist()],
        'overbought': 80,
        'oversold': 20,
        'current': {
            'k': round(k_line.iloc[-1], 2) if not pd.isna(k_line.iloc[-1]) else 50,
            'd': round(d_line.iloc[-1], 2) if not pd.isna(d_line.iloc[-1]) else 50,
        }
    }


def calculate_moving_averages(df):
    """Calculate various moving averages"""
    close = df['Close']
    
    sma_20 = close.rolling(window=20).mean()
    sma_50 = close.rolling(window=50).mean()
    sma_200 = close.rolling(window=200).mean()
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    
    current_price = close.iloc[-1]
    
    def get_status(ma_value):
        if pd.isna(ma_value):
            return 'neutral'
        if current_price > ma_value * 1.02:
            return 'bullish'
        elif current_price < ma_value * 0.98:
            return 'bearish'
        return 'neutral'
    
    return {
        'sma20': {
            'values': [round(v, 2) if not pd.isna(v) else None for v in sma_20.tolist()],
            'current': round(sma_20.iloc[-1], 2) if not pd.isna(sma_20.iloc[-1]) else None,
            'status': get_status(sma_20.iloc[-1]),
        },
        'sma50': {
            'values': [round(v, 2) if not pd.isna(v) else None for v in sma_50.tolist()],
            'current': round(sma_50.iloc[-1], 2) if not pd.isna(sma_50.iloc[-1]) else None,
            'status': get_status(sma_50.iloc[-1]),
        },
        'sma200': {
            'values': [round(v, 2) if not pd.isna(v) else None for v in sma_200.tolist()],
            'current': round(sma_200.iloc[-1], 2) if not pd.isna(sma_200.iloc[-1]) else None,
            'status': get_status(sma_200.iloc[-1]),
        },
        'ema12': {
            'values': [round(v, 2) if not pd.isna(v) else None for v in ema_12.tolist()],
            'current': round(ema_12.iloc[-1], 2) if not pd.isna(ema_12.iloc[-1]) else None,
            'status': get_status(ema_12.iloc[-1]),
        },
        'ema26': {
            'values': [round(v, 2) if not pd.isna(v) else None for v in ema_26.tolist()],
            'current': round(ema_26.iloc[-1], 2) if not pd.isna(ema_26.iloc[-1]) else None,
            'status': get_status(ema_26.iloc[-1]),
        },
        'currentPrice': round(current_price, 2) if not pd.isna(current_price) else None,
    }


def calculate_bollinger_bands(df, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    close = df['Close']
    
    middle = close.rolling(window=period).mean()
    std = close.rolling(window=period).std()
    upper = middle + (std * std_dev)
    lower = middle - (std * std_dev)
    
    current_price = close.iloc[-1]
    
    # Calculate %B (position within bands)
    percent_b = (close - lower) / (upper - lower) * 100
    
    return {
        'upper': [round(v, 2) if not pd.isna(v) else None for v in upper.tolist()],
        'middle': [round(v, 2) if not pd.isna(v) else None for v in middle.tolist()],
        'lower': [round(v, 2) if not pd.isna(v) else None for v in lower.tolist()],
        'percentB': [round(v, 2) if not pd.isna(v) else 50 for v in percent_b.tolist()],
        'current': {
            'upper': round(upper.iloc[-1], 2) if not pd.isna(upper.iloc[-1]) else None,
            'middle': round(middle.iloc[-1], 2) if not pd.isna(middle.iloc[-1]) else None,
            'lower': round(lower.iloc[-1], 2) if not pd.isna(lower.iloc[-1]) else None,
            'percentB': round(percent_b.iloc[-1], 2) if not pd.isna(percent_b.iloc[-1]) else 50,
            'price': round(current_price, 2) if not pd.isna(current_price) else None,
        }
    }


def calculate_volume_analysis(df):
    """Calculate volume analysis metrics"""
    volume = df['Volume']
    close = df['Close']
    
    avg_volume_20 = volume.rolling(window=20).mean()
    current_volume = volume.iloc[-1]
    avg_vol = avg_volume_20.iloc[-1]
    
    # Volume ratio
    volume_ratio = (current_volume / avg_vol * 100) if avg_vol > 0 else 100
    
    # Price-Volume trend (simple)
    price_change = close.pct_change()
    volume_trend = []
    for i in range(len(df)):
        if i == 0:
            volume_trend.append('neutral')
        else:
            if price_change.iloc[i] > 0 and volume.iloc[i] > avg_volume_20.iloc[i]:
                volume_trend.append('bullish')
            elif price_change.iloc[i] < 0 and volume.iloc[i] > avg_volume_20.iloc[i]:
                volume_trend.append('bearish')
            else:
                volume_trend.append('neutral')
    
    return {
        'volume': [int(v) if not pd.isna(v) else 0 for v in volume.tolist()],
        'avgVolume20': [round(v, 0) if not pd.isna(v) else 0 for v in avg_volume_20.tolist()],
        'current': {
            'volume': int(current_volume) if not pd.isna(current_volume) else 0,
            'avgVolume': int(avg_vol) if not pd.isna(avg_vol) else 0,
            'ratio': round(volume_ratio, 1) if not pd.isna(volume_ratio) else 100,
        },
        'trend': volume_trend[-1] if volume_trend else 'neutral',
    }


def calculate_overall_signal(rsi_data, macd_data, stoch_data, ma_data):
    """Calculate overall technical signal based on all indicators"""
    signals = []
    weights = []
    
    # RSI signal (weight: 25%)
    rsi = rsi_data['current']
    if rsi <= 30:
        signals.append(1)  # Bullish
    elif rsi >= 70:
        signals.append(-1)  # Bearish
    else:
        signals.append(0)  # Neutral
    weights.append(25)
    
    # MACD signal (weight: 30%)
    macd_hist = macd_data['current']['histogram']
    if macd_hist > 0:
        signals.append(1)
    elif macd_hist < 0:
        signals.append(-1)
    else:
        signals.append(0)
    weights.append(30)
    
    # Stochastic signal (weight: 20%)
    stoch_k = stoch_data['current']['k']
    if stoch_k <= 20:
        signals.append(1)
    elif stoch_k >= 80:
        signals.append(-1)
    else:
        signals.append(0)
    weights.append(20)
    
    # Moving average signal (weight: 25%)
    ma_bullish = sum(1 for ma in ['sma20', 'sma50', 'ema12', 'ema26'] if ma_data[ma]['status'] == 'bullish')
    ma_bearish = sum(1 for ma in ['sma20', 'sma50', 'ema12', 'ema26'] if ma_data[ma]['status'] == 'bearish')
    if ma_bullish > ma_bearish:
        signals.append(1)
    elif ma_bearish > ma_bullish:
        signals.append(-1)
    else:
        signals.append(0)
    weights.append(25)
    
    # Calculate weighted score
    weighted_sum = sum(s * w for s, w in zip(signals, weights))
    total_weight = sum(weights)
    score = weighted_sum / total_weight
    
    # Determine signal
    if score > 0.3:
        signal = 'BUY'
    elif score < -0.3:
        signal = 'SELL'
    else:
        signal = 'HOLD'
    
    # Calculate confidence (how strong the agreement is)
    confidence = min(abs(score) * 100 + 50, 95)  # Scale to 50-95%
    
    return {
        'signal': signal,
        'score': round(score, 2),
        'confidence': round(confidence, 0),
    }


@require_GET
def technical_indicators(request, symbol):
    """
    GET /api/market-data/indicators/{symbol}/
    
    Query params:
    - timeframe: D (1 day), W (1 week), M (1 month), Y (1 year)
    - indicator: MACD, RSI, STOCH, MA, BB, VOLUME, ALL (default: ALL)
    
    Returns technical indicator data for animated charts.
    """
    timeframe = request.GET.get('timeframe', 'D')
    indicator = request.GET.get('indicator', 'ALL').upper()
    
    # Check cache first
    cache_key = f"indicators_{symbol.upper()}_{timeframe}_{indicator}"
    cached_data = _cache.get(cache_key)
    if cached_data and time.time() - cached_data['timestamp'] < CACHE_DURATION:
        return JsonResponse(cached_data['data'])
    
    # Map timeframe to yfinance period/interval
    timeframe_map = {
        'D': {'period': '5d', 'interval': '15m'},
        'W': {'period': '1mo', 'interval': '1h'},
        'M': {'period': '3mo', 'interval': '1d'},
        'Y': {'period': '1y', 'interval': '1wk'},
    }
    
    config = timeframe_map.get(timeframe, timeframe_map['D'])
    
    try:
        ticker = yf.Ticker(symbol.upper())
        df = ticker.history(period=config['period'], interval=config['interval'])
        
        if df.empty:
            return JsonResponse({
                'error': 'No data found for symbol. The market may be closed or the symbol may be invalid.',
                'symbol': symbol.upper(),
                'retryAfter': 30
            }, status=404)
        
        # Get timestamps
        timestamps = df.index.strftime('%Y-%m-%d %H:%M').tolist()
        
        response_data = {
            'symbol': symbol.upper(),
            'timeframe': timeframe,
            'timestamps': timestamps,
            'dataPoints': len(timestamps),
        }
        
        # Calculate requested indicators
        if indicator == 'ALL':
            response_data['macd'] = calculate_macd(df)
            response_data['rsi'] = calculate_rsi(df)
            response_data['stochastic'] = calculate_stochastic(df)
            response_data['movingAverages'] = calculate_moving_averages(df)
            response_data['bollingerBands'] = calculate_bollinger_bands(df)
            response_data['volume'] = calculate_volume_analysis(df)
            response_data['overallSignal'] = calculate_overall_signal(
                response_data['rsi'],
                response_data['macd'],
                response_data['stochastic'],
                response_data['movingAverages']
            )
        elif indicator == 'MACD':
            response_data['macd'] = calculate_macd(df)
        elif indicator == 'RSI':
            response_data['rsi'] = calculate_rsi(df)
        elif indicator == 'STOCH':
            response_data['stochastic'] = calculate_stochastic(df)
        elif indicator == 'MA':
            response_data['movingAverages'] = calculate_moving_averages(df)
        elif indicator == 'BB':
            response_data['bollingerBands'] = calculate_bollinger_bands(df)
        elif indicator == 'VOLUME':
            response_data['volume'] = calculate_volume_analysis(df)
        else:
            return JsonResponse({'error': f'Invalid indicator: {indicator}'}, status=400)
        
        # Cache the response
        _cache[cache_key] = {
            'data': response_data,
            'timestamp': time.time()
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error fetching indicators for {symbol}: {error_msg}")
        
        # Handle rate limiting specifically
        if 'Too Many Requests' in error_msg or 'Rate' in error_msg:
            return JsonResponse({
                'error': 'Rate limited by data provider. Please wait a moment and try again.',
                'retryAfter': 60,
                'symbol': symbol.upper()
            }, status=429)
        
        return JsonResponse({
            'error': 'Failed to fetch indicator data. Please try again.',
            'details': error_msg,
            'symbol': symbol.upper()
        }, status=500)
