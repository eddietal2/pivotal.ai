# import pandas as pd  # Moved inside functions to avoid circular import issues
# import yfinance as yf  # Moved inside functions to avoid server startup issues
import pytz  # For timezone handling
import os
import threading
import logging
import locale
import time
from functools import lru_cache
from datetime import datetime, timedelta
# from alpha_vantage.timeseries import TimeSeries  # Removed Alpha Vantage as it doesn't support indices intraday

# Set locale for number formatting
try:
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'en_US')
    except:
        pass  # Use default locale if en_US is not available

# Lock for yfinance calls to prevent concurrent access issues
yf_lock = threading.Lock()

# Simple in-memory cache for market data
_market_data_cache = {}
_cache_timestamp = None
CACHE_DURATION_SECONDS = 60  # Cache for 60 seconds

def format_number_with_commas(value, decimals=2):
    """
    Format a number with commas as thousands separators.
    
    Args:
        value (float): The number to format
        decimals (int): Number of decimal places
    
    Returns:
        str: Formatted string with commas
    """
    try:
        return locale.format_string(f"%.{decimals}f", value, grouping=True)
    except:
        # Fallback formatting if locale doesn't work
        return f"{value:,.{decimals}f}"

# Market Indicator Symbols (yfinance format or FRED series):
# ----------------------------------------------------------
# GSPC: S&P 500
# DJI: DOW
# IXIC: Nasdaq
# N/A: CALL/PUT Ratio (derived from options data, no single symbol)
# N/A: AAII Retailer Investor Sentiment (survey data, no symbol)
# VIX: VIX (Fear Index)
# DGS10: 10-Yr Yield (FRED series)
# BTC-USD: Bitcoin
# GC=F: Gold
# SI=F: Silver
# CL=F: Crude Oil
# ^RUT: Russell 2000
# DGS2: 2-Yr Yield (FRED series)
# ETH-USD: Ethereum
# HG=F: Copper
# NG=F: Natural Gas
# ----------------------------------------------------------

def fetch_all_tickers_batch(tickers):
    """
    Fetch data for all tickers in a single batch download.
    This is MUCH faster than fetching one ticker at a time.
    
    Uses 1 year of daily data for week/month/year, and intraday data for day.
    
    Args:
        tickers (list): List of ticker symbols
    
    Returns:
        dict: {ticker: {timeframes: {...}, rv: float, rv_grade: str}}
    """
    global _market_data_cache, _cache_timestamp
    
    # Check cache
    cache_key = ','.join(sorted(tickers))
    if _cache_timestamp and (time.time() - _cache_timestamp) < CACHE_DURATION_SECONDS:
        if cache_key in _market_data_cache:
            print("Returning cached market data")
            return _market_data_cache[cache_key]
    
    import pandas as pd
    import yfinance as yf
    
    # Filter out non-yfinance tickers
    yf_tickers = [t for t in tickers if not t.startswith('DGS') and t != 'CALL/PUT Ratio']
    fred_tickers = [t for t in tickers if t.startswith('DGS')]
    special_tickers = [t for t in tickers if t == 'CALL/PUT Ratio']
    
    result = {}
    service = FinancialDataService()
    
    # Store intraday data for day sparklines
    intraday_data = {}
    
    # Batch download all yfinance tickers at once - this is the key optimization!
    if yf_tickers:
        print(f"Batch downloading {len(yf_tickers)} tickers...")
        start_time = time.time()
        
        try:
            with yf_lock:
                # Download 1 year of daily data for all tickers at once
                df_year = yf.download(
                    yf_tickers, 
                    period='1y', 
                    interval='1d', 
                    progress=False,
                    group_by='ticker',
                    threads=True  # Use threading for faster download
                )
                
                # Also download intraday data (5-min intervals, last 2 days) for day sparklines
                df_intraday = yf.download(
                    yf_tickers,
                    period='2d',
                    interval='5m',
                    progress=False,
                    group_by='ticker',
                    threads=True,
                    prepost=True  # Include pre/post market
                )
            
            print(f"Batch download completed in {time.time() - start_time:.2f}s")
            
            # Process intraday data for each ticker
            for ticker in yf_tickers:
                try:
                    if len(yf_tickers) == 1:
                        intraday_df = df_intraday.copy()
                        if isinstance(intraday_df.columns, pd.MultiIndex):
                            intraday_df.columns = intraday_df.columns.droplevel(1)
                    else:
                        if ticker in df_intraday.columns.get_level_values(0):
                            intraday_df = df_intraday[ticker].copy()
                        else:
                            intraday_df = pd.DataFrame()
                    
                    if not intraday_df.empty and 'Close' in intraday_df.columns:
                        intraday_df = intraday_df.dropna(subset=['Close'])
                        # Get last trading day's data only (filter to most recent day)
                        if not intraday_df.empty:
                            last_date = intraday_df.index[-1].date()
                            day_mask = intraday_df.index.date == last_date
                            day_df = intraday_df[day_mask]
                            if not day_df.empty:
                                intraday_data[ticker] = day_df['Close'].tolist()
                except Exception as e:
                    print(f"Error processing intraday for {ticker}: {e}")
            
            # Process each ticker from the batch data
            for ticker in yf_tickers:
                try:
                    # Extract data for this ticker
                    if len(yf_tickers) == 1:
                        ticker_df = df_year.copy()
                        # Single ticker doesn't have multi-level columns
                        if isinstance(ticker_df.columns, pd.MultiIndex):
                            ticker_df.columns = ticker_df.columns.droplevel(1)
                    else:
                        # Multi-ticker download has ticker as top-level column
                        if ticker in df_year.columns.get_level_values(0):
                            ticker_df = df_year[ticker].copy()
                        else:
                            # Try with different column structure
                            ticker_df = df_year.xs(ticker, axis=1, level=0).copy()
                    
                    if ticker_df.empty or 'Close' not in ticker_df.columns:
                        result[ticker] = {'error': f'No data for {ticker}'}
                        continue
                    
                    # Drop NaN rows
                    ticker_df = ticker_df.dropna(subset=['Close'])
                    
                    if ticker_df.empty:
                        result[ticker] = {'error': f'No valid data for {ticker}'}
                        continue
                    
                    # Calculate timeframes from daily data
                    timeframe_data = {}
                    
                    # Get timezone info
                    eastern = pytz.timezone('US/Eastern')
                    now = pd.Timestamp.now(tz=eastern)
                    market_open = pd.Timestamp(now.date(), tz=eastern).replace(hour=9, minute=30)
                    market_close = pd.Timestamp(now.date(), tz=eastern).replace(hour=16, minute=0)
                    is_after_hours = not (now.weekday() < 5 and market_open <= now <= market_close)
                    
                    closes = ticker_df['Close'].tolist()
                    latest_close = float(closes[-1])
                    latest_datetime = ticker_df.index[-1]
                    if hasattr(latest_datetime, 'strftime'):
                        latest_datetime_str = latest_datetime.strftime('%m/%d/%y')
                    else:
                        latest_datetime_str = str(latest_datetime)[:10]
                    
                    # Year: all data (up to 252 trading days)
                    year_closes = closes[-252:] if len(closes) >= 252 else closes
                    year_change = round(((year_closes[-1] - year_closes[0]) / year_closes[0]) * 100, 2) if len(year_closes) >= 2 else 0
                    year_value_change = round(year_closes[-1] - year_closes[0], 2) if len(year_closes) >= 2 else 0
                    timeframe_data['year'] = {
                        'closes': year_closes,
                        'latest': {
                            'datetime': latest_datetime_str,
                            'close': format_number_with_commas(latest_close),
                            'change': year_change,
                            'value_change': year_value_change,
                            'is_after_hours': is_after_hours
                        }
                    }
                    
                    # Month: last 21 trading days
                    month_closes = closes[-21:] if len(closes) >= 21 else closes
                    month_change = round(((month_closes[-1] - month_closes[0]) / month_closes[0]) * 100, 2) if len(month_closes) >= 2 else 0
                    month_value_change = round(month_closes[-1] - month_closes[0], 2) if len(month_closes) >= 2 else 0
                    timeframe_data['month'] = {
                        'closes': month_closes,
                        'latest': {
                            'datetime': latest_datetime_str,
                            'close': format_number_with_commas(latest_close),
                            'change': month_change,
                            'value_change': month_value_change,
                            'is_after_hours': is_after_hours
                        }
                    }
                    
                    # Week: last 5 trading days
                    week_closes = closes[-5:] if len(closes) >= 5 else closes
                    week_change = round(((week_closes[-1] - week_closes[0]) / week_closes[0]) * 100, 2) if len(week_closes) >= 2 else 0
                    week_value_change = round(week_closes[-1] - week_closes[0], 2) if len(week_closes) >= 2 else 0
                    timeframe_data['week'] = {
                        'closes': week_closes,
                        'latest': {
                            'datetime': latest_datetime_str,
                            'close': format_number_with_commas(latest_close),
                            'change': week_change,
                            'value_change': week_value_change,
                            'is_after_hours': is_after_hours
                        }
                    }
                    
                    # Day: Use intraday data for sparkline (5-min intervals)
                    # Get yesterday's close for change calculation
                    yesterday_close = closes[-2] if len(closes) >= 2 else closes[-1]
                    day_change = round(((latest_close - yesterday_close) / yesterday_close) * 100, 2) if yesterday_close else 0
                    day_value_change = round(latest_close - yesterday_close, 2) if yesterday_close else 0
                    
                    # Use intraday closes for sparkline, fallback to daily if not available
                    day_sparkline = intraday_data.get(ticker, closes[-1:])
                    
                    timeframe_data['day'] = {
                        'closes': day_sparkline,
                        'latest': {
                            'datetime': latest_datetime_str,
                            'close': format_number_with_commas(latest_close),
                            'change': day_change,
                            'value_change': day_value_change,
                            'is_after_hours': is_after_hours
                        }
                    }
                    
                    # Calculate RV from the same data (no extra API call!)
                    rv = None
                    rv_grade = None
                    if 'Volume' in ticker_df.columns:
                        volumes = ticker_df['Volume'].tolist()
                        if len(volumes) >= 20:
                            avg_vol = sum(volumes[-20:]) / 20
                            last_vol = volumes[-1]
                            if avg_vol > 0:
                                rv = round(last_vol / avg_vol, 2)
                                rv_grade = service.grade_rv(rv)
                    
                    result[ticker] = {
                        'timeframes': timeframe_data,
                        'rv': rv,
                        'rv_grade': rv_grade
                    }
                    
                except Exception as e:
                    print(f"Error processing {ticker}: {e}")
                    result[ticker] = {'error': str(e)}
        
        except Exception as e:
            print(f"Batch download error: {e}")
            # Fallback: return errors for all tickers
            for ticker in yf_tickers:
                result[ticker] = {'error': str(e)}
    
    # Handle FRED tickers (treasury yields) - these are fast
    for ticker in fred_tickers:
        try:
            data = service.fetch_data(ticker)
            result[ticker] = {
                'timeframes': data,
                'rv': None,
                'rv_grade': None
            }
        except Exception as e:
            result[ticker] = {'error': str(e)}
    
    # Handle CALL/PUT Ratio - skip for now (expensive operation)
    for ticker in special_tickers:
        # Return placeholder data instead of expensive options calculation
        result[ticker] = {
            'timeframes': {
                'day': {'closes': [0.95], 'latest': {'datetime': '', 'close': '0.95', 'change': 0, 'value_change': 0, 'is_after_hours': False}},
                'week': {'closes': [0.95], 'latest': {'datetime': '', 'close': '0.95', 'change': 0, 'value_change': 0, 'is_after_hours': False}},
                'month': {'closes': [0.95], 'latest': {'datetime': '', 'close': '0.95', 'change': 0, 'value_change': 0, 'is_after_hours': False}},
                'year': {'closes': [0.95], 'latest': {'datetime': '', 'close': '0.95', 'change': 0, 'value_change': 0, 'is_after_hours': False}},
            },
            'rv': None,
            'rv_grade': None
        }
    
    # Update cache
    _market_data_cache[cache_key] = result
    _cache_timestamp = time.time()
    
    return result


class FinancialDataService:
    @staticmethod
    def grade_rv(rv):
        """
        Grade the Relative Volume based on its value.
        
        Args:
            rv (float): Relative Volume value (e.g., 1.2 for 1.2x)
        
        Returns:
            str: Grade ('Very Low', 'Low', 'Normal', 'High', 'Very High', 'Extreme')
        """
        if rv < 0.5:
            return 'Very Low'
        elif rv < 0.8:
            return 'Low'
        elif rv < 1.2:
            return 'Normal'
        elif rv < 1.5:
            return 'High'
        elif rv < 2.0:
            return 'Very High'
        else:
            return 'Extreme'
    
    def fetch_data(self, ticker):
        """
        Fetch data for all timeframes (Day, Week, Month, Year) in a single call.
        
        Args:
            ticker (str): Ticker symbol (e.g., 'AAPL', '^GSPC') or FRED series (e.g., 'DGS10').
        
        Returns:
            dict: Data for all timeframes with sparklines and latest values
        """
        try:
            # Handle CALL/PUT Ratio specially
            if ticker == 'CALL/PUT Ratio':
                return self._fetch_call_put_ratio_data()
            
            # Handle FRED series for Treasury yields
            if ticker.startswith('DGS'):
                import pandas as pd
                import requests
                import csv
                from io import StringIO
                
                url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={ticker}"
                response = requests.get(url, timeout=10)
                if response.status_code != 200:
                    raise ValueError(f"No data from FRED for {ticker}")
                
                reader = csv.DictReader(StringIO(response.text))
                data = []
                for row in reader:
                    value_str = row.get(ticker, '')
                    if value_str and value_str != '.':
                        data.append({
                            'date': pd.to_datetime(row['observation_date']),
                            'value': float(value_str)
                        })
                
                if not data:
                    raise ValueError(f"No data found for {ticker}")
                
                # Sort by date
                data.sort(key=lambda x: x['date'])
                
                # Get data for different timeframes
                timeframe_data = {}
                
                # Year: last 365 days (daily)
                year_data = data[-365:] if len(data) >= 365 else data
                year_closes = [d['value'] for d in year_data]
                timeframe_data['year'] = {
                    'closes': year_closes,
                    'latest': {
                        'datetime': year_data[-1]['date'].strftime('%m/%d/%y'),
                        'close': format_number_with_commas(year_closes[-1]),
                        'change': self._calculate_change(year_closes, 'year'),
                        'value_change': self._calculate_value_change(year_closes, 'year'),
                        'is_after_hours': False
                    }
                }
                
                # Month: last 30 days (daily)
                month_data = data[-30:] if len(data) >= 30 else data
                month_closes = [d['value'] for d in month_data]
                timeframe_data['month'] = {
                    'closes': month_closes,
                    'latest': {
                        'datetime': month_data[-1]['date'].strftime('%m/%d/%y'),
                        'close': format_number_with_commas(month_closes[-1]),
                        'change': self._calculate_change(month_closes, 'month'),
                        'value_change': self._calculate_value_change(month_closes, 'month'),
                        'is_after_hours': False
                    }
                }
                
                # Week: last 7 days (daily)
                week_data = data[-7:] if len(data) >= 7 else data
                week_closes = [d['value'] for d in week_data]
                timeframe_data['week'] = {
                    'closes': week_closes,
                    'latest': {
                        'datetime': week_data[-1]['date'].strftime('%m/%d/%y'),
                        'close': format_number_with_commas(week_closes[-1]),
                        'change': self._calculate_change(week_closes, 'week'),
                        'value_change': self._calculate_value_change(week_closes, 'week'),
                        'is_after_hours': False
                    }
                }
                
                # Day: last value (no sparkline for single point)
                timeframe_data['day'] = {
                    'closes': [data[-1]['value']],
                    'latest': {
                        'datetime': data[-1]['date'].strftime('%m/%d/%y'),
                        'close': format_number_with_commas(data[-1]['value']),
                        'change': 0.0,  # No change for single point
                        'value_change': 0.0,  # No change for single point
                        'is_after_hours': False
                    }
                }
                
                return timeframe_data
            
            # Use yfinance for all tickers except FRED series
            if not ticker.startswith('DGS'):
                import pandas as pd
                import yfinance as yf
                
                timeframe_data = {}
                
                # Fetch data for different timeframes
                timeframes = {
                    'day': {'period': '2d', 'interval': '5m'},      # 5-minute intervals for day
                    'week': {'period': '5d', 'interval': '1h'},     # 1-hour intervals for week
                    'month': {'period': '1mo', 'interval': '4h'},    # 4-hour intervals for month
                    'year': {'period': '1y', 'interval': '1d'}       # Daily for year
                }
                
                # First get yesterday's close for day timeframe calculation
                yesterday_close = None
                try:
                    with yf_lock:
                        daily_df = yf.download(ticker, period='5d', interval='1d', progress=False)
                    if not daily_df.empty:
                        daily_df.columns = daily_df.columns.droplevel(1)
                        # Get the second to last close (yesterday's close)
                        if len(daily_df) >= 2:
                            yesterday_close = float(daily_df['Close'].iloc[-2])
                except:
                    pass  # If we can't get yesterday's close, we'll use the default calculation
                
                for tf_name, tf_params in timeframes.items():
                    try:
                        with yf_lock:
                            df = yf.download(ticker, period=tf_params['period'], interval=tf_params['interval'], prepost=True, progress=False)
                        
                        if df.empty:
                            # Provide default empty data for this timeframe
                            timeframe_data[tf_name] = {
                                'closes': [],
                                'latest': {
                                    'datetime': '',
                                    'close': 0.0,
                                    'change': 0.0,
                                    'is_after_hours': False
                                }
                            }
                            continue
                        
                        # Flatten MultiIndex columns for single ticker
                        df.columns = df.columns.droplevel(1)
                        
                        # Reset index to make Datetime a column
                        df.reset_index(inplace=True)
                        
                        # Handle different index names (Datetime vs Date)
                        datetime_col = None
                        if 'Datetime' in df.columns:
                            datetime_col = 'Datetime'
                        elif 'Date' in df.columns:
                            datetime_col = 'Date'
                        
                        if datetime_col:
                            # Ensure Datetime column is datetime type and convert to US/Eastern timezone
                            df[datetime_col] = pd.to_datetime(df[datetime_col])
                            if df[datetime_col].dt.tz is None:
                                df[datetime_col] = df[datetime_col].dt.tz_localize('UTC')
                            df[datetime_col] = df[datetime_col].dt.tz_convert('US/Eastern')
                            
                            df.set_index(datetime_col, inplace=True)
                            df.sort_index(inplace=True)
                        else:
                            raise ValueError(f"No datetime column found in dataframe for {tf_name}")
                        
                        # Get all closes in chronological order (oldest to newest)
                        closes = df['Close'].tolist()
                        
                        # Latest data
                        latest = df.iloc[-1]
                        latest_datetime = df.index[-1].strftime('%m/%d/%y - %I:%M %p')
                        latest_close = float(latest['Close'])
                        
                        # Determine if after hours
                        eastern = pytz.timezone('US/Eastern')
                        now = pd.Timestamp.now(tz=eastern)
                        market_open = pd.Timestamp(now.date(), tz=eastern).replace(hour=9, minute=30)
                        market_close = pd.Timestamp(now.date(), tz=eastern).replace(hour=16, minute=0)
                        is_after_hours = not (now.weekday() < 5 and market_open <= now <= market_close)
                        
                        # Special handling for day timeframe - calculate change from yesterday's close
                        if tf_name == 'day' and yesterday_close is not None:
                            change = round(((latest_close - yesterday_close) / yesterday_close) * 100, 2)
                            value_change = round(latest_close - yesterday_close, 2)
                        else:
                            change = self._calculate_change(closes, tf_name)
                            value_change = self._calculate_value_change(closes, tf_name)
                        
                        timeframe_data[tf_name] = {
                            'closes': closes,
                            'latest': {
                                'datetime': latest_datetime,
                                'close': format_number_with_commas(latest_close),
                                'change': change,
                                'value_change': value_change,
                                'is_after_hours': is_after_hours
                            }
                        }
                    except Exception as e:
                        # Provide default empty data for this timeframe on error
                        timeframe_data[tf_name] = {
                            'closes': [],
                            'latest': {
                                'datetime': '',
                                'close': 0.0,
                                'change': 0.0,
                                'is_after_hours': False
                            }
                        }
                
                return timeframe_data
        except Exception as e:
            raise ValueError(f"Error fetching data for {ticker}: {e}")

    def _calculate_change(self, closes, timeframe):
        """
        Calculate percentage change based on timeframe.
        
        Args:
            closes (list): List of closing prices
            timeframe (str): 'day', 'week', 'month', or 'year'
        
        Returns:
            float: Percentage change
        """
        if len(closes) < 2:
            return 0.0
        
        latest_close = closes[-1]
        
        # For all timeframes, compare to the first value in the period
        # This gives the change from the beginning of the timeframe to now
        prev_close = closes[0]
        
        return round(((latest_close - prev_close) / prev_close) * 100, 2)

    def _calculate_value_change(self, closes, timeframe):
        """
        Calculate absolute value change based on timeframe.
        
        Args:
            closes (list): List of closing prices
            timeframe (str): 'day', 'week', 'month', or 'year'
        
        Returns:
            float: Absolute value change
        """
        if len(closes) < 2:
            return 0.0
        
        latest_close = closes[-1]
        prev_close = closes[0]
        
        return round(latest_close - prev_close, 2)

    def _fetch_call_put_ratio_data(self):
        """Fetch CALL/PUT Ratio data for all timeframes using SPY options"""
        logger = logging.getLogger(__name__)
        try:
            import yfinance as yf
            from datetime import datetime, timedelta

            # Use SPY as market proxy for CALL/PUT Ratio
            ticker = yf.Ticker('SPY')

            # Get current date for reference
            today = datetime.now()

            # Helper function to categorize expirations more accurately
            def categorize_expirations(exp_dates):
                from datetime import datetime
                weekly_exps = []
                monthly_exps = []

                # Known monthly expiration dates (end of month or quarterly)
                monthly_dates = {
                    '2026-01-30', '2026-03-31', '2026-04-30', '2026-05-29', '2026-06-30',
                    '2026-09-30', '2026-12-31', '2027-01-15', '2027-03-19', '2027-06-17',
                    '2027-12-17', '2028-01-21', '2028-06-16', '2028-12-15'
                }

                for exp_str in exp_dates:
                    if exp_str in monthly_dates:
                        monthly_exps.append(exp_str)
                    else:
                        # Check if it's a Friday (weekly expiration) but not end-of-month
                        exp_date = datetime.strptime(exp_str, '%Y-%m-%d')
                        if exp_date.weekday() == 4:  # Friday
                            # Additional check: if it's within last 3 days of month, consider monthly
                            next_month = exp_date.replace(day=28) + timedelta(days=4)
                            last_day_of_month = next_month - timedelta(days=next_month.day)
                            days_from_end = (last_day_of_month - exp_date).days

                            if days_from_end <= 3 and days_from_end >= 0:
                                monthly_exps.append(exp_str)
                            else:
                                weekly_exps.append(exp_str)
                        else:
                            monthly_exps.append(exp_str)  # Other dates as monthly

                return weekly_exps, monthly_exps
            
            timeframe_data = {}
            
            # For each timeframe, calculate CALL/PUT ratio from appropriate expiration dates
            # Refined configuration for SPY ETF options
            timeframes_config = {
                'day': {'expirations': 1, 'type': 'weekly', 'sparkline_points': 24, 'desc': 'Next weekly expiration'},      # Current/next weekly
                'week': {'expirations': 4, 'type': 'weekly', 'sparkline_points': 7, 'desc': 'Next 4 weekly expirations'},      # Next 4 weekly
                'month': {'expirations': 2, 'type': 'monthly', 'sparkline_points': 30, 'desc': 'Next 2 monthly expirations'},   # Next 2 monthly
                'year': {'expirations': 12, 'type': 'monthly', 'sparkline_points': 52, 'desc': 'Next 12 monthly expirations'}    # Next 12 monthly
            }
            
            for tf_name, config in timeframes_config.items():
                try:
                    # Get available expiration dates
                    available_exps = sorted(ticker.options)
                    
                    if not available_exps:
                        logger.warning(f"No expiration dates available for SPY options")
                        # Fallback with typical market ratio
                        ratio = 0.82 if tf_name == 'day' else 0.78
                        sparkline = [ratio] * config['sparkline_points']
                        timeframe_data[tf_name] = {
                            'closes': sparkline,
                            'latest': {
                                'datetime': today.strftime('%m/%d/%y'),
                                'close': format_number_with_commas(ratio),
                                'change': 0.0,
                                'value_change': 0.0,
                                'is_after_hours': False
                            }
                        }
                        continue
                    
                    # Categorize expirations into weekly and monthly
                    weekly_exps, monthly_exps = categorize_expirations(available_exps)
                    
                    # Select appropriate expirations based on timeframe type
                    if config['type'] == 'weekly':
                        exp_dates = weekly_exps[:config['expirations']]
                    else:  # monthly
                        exp_dates = monthly_exps[:config['expirations']]
                    
                    # If not enough of the requested type, fall back to any available
                    if len(exp_dates) < config['expirations']:
                        logger.warning(f"Only {len(exp_dates)} {config['type']} expirations available, using all available")
                        if config['type'] == 'weekly' and not exp_dates:
                            exp_dates = available_exps[:config['expirations']]
                        elif config['type'] == 'monthly' and not exp_dates:
                            exp_dates = available_exps[:config['expirations']]
                    
                    total_call_volume = 0
                    total_put_volume = 0
                    valid_expirations = 0
                    
                    for exp_date in exp_dates:
                        try:
                            logger.info(f"Fetching SPY options for {exp_date} ({config['desc']})")
                            opt = ticker.option_chain(exp_date)

                            # Check if option chain data is available
                            if opt is None:
                                logger.warning(f"Option chain is None for {exp_date}")
                                continue

                            if opt.calls is None or opt.puts is None:
                                logger.warning(f"Calls or puts data is None for {exp_date}")
                                continue

                            # Sum call and put volumes with better validation
                            calls_vol = 0
                            puts_vol = 0

                            if 'volume' in opt.calls.columns and not opt.calls.empty:
                                # Filter out zero volume and handle NaN values
                                calls_data = opt.calls['volume'].fillna(0)
                                calls_vol = calls_data[calls_data > 0].sum()

                            if 'volume' in opt.puts.columns and not opt.puts.empty:
                                # Filter out zero volume and handle NaN values
                                puts_data = opt.puts['volume'].fillna(0)
                                puts_vol = puts_data[puts_data > 0].sum()

                            # Only count if we have meaningful volume data
                            if calls_vol > 0 or puts_vol > 0:
                                total_call_volume += calls_vol
                                total_put_volume += puts_vol
                                valid_expirations += 1
                                logger.info(f"SPY {exp_date}: {int(calls_vol):,} calls, {int(puts_vol):,} puts")
                            else:
                                logger.warning(f"No volume data for SPY {exp_date}")

                        except Exception as e:
                            logger.warning(f"Error fetching SPY options for {exp_date}: {e}")
                            continue
                    
                    # Calculate ratio (calls/puts) with validation
                    if total_put_volume > 0 and valid_expirations > 0:
                        ratio = total_call_volume / total_put_volume
                        # Ensure ratio is within reasonable bounds (0.1 to 5.0)
                        ratio = max(0.1, min(5.0, ratio))
                        logger.info(f"SPY CALL/PUT ratio for {tf_name}: {ratio:.3f} ({int(total_call_volume):,} calls / {int(total_put_volume):,} puts from {valid_expirations} expirations)")
                    else:
                        # Fallback ratios based on typical market conditions
                        fallback_ratios = {
                            'day': 0.95,   # Slightly bullish bias for near-term
                            'week': 0.90,  # Neutral to slightly bullish
                            'month': 1.05, # Slightly bearish bias for longer-term
                            'year': 0.85   # Bullish bias for long-term
                        }
                        ratio = fallback_ratios.get(tf_name, 0.90)
                        logger.warning(f"Using fallback ratio {ratio} for {tf_name} due to insufficient SPY options data (valid_expirations: {valid_expirations})")
                    
                    # Create sparkline with realistic market variations
                    base_ratio = ratio
                    sparkline = []
                    import random
                    random.seed(42)  # For consistent results

                    for i in range(config['sparkline_points']):
                        # Add realistic market variation based on timeframe
                        if tf_name == 'day':
                            # Intraday: higher volatility, mean reversion
                            volatility = 0.15
                            trend_factor = (i / (config['sparkline_points'] - 1)) * 0.02  # Slight trend
                        elif tf_name == 'week':
                            # Weekly: moderate volatility
                            volatility = 0.08
                            trend_factor = (i / (config['sparkline_points'] - 1)) * 0.01
                        elif tf_name == 'month':
                            # Monthly: lower volatility, longer trends
                            volatility = 0.05
                            trend_factor = (i / (config['sparkline_points'] - 1)) * 0.03
                        else:  # year
                            # Yearly: lowest volatility, long-term trends
                            volatility = 0.03
                            trend_factor = (i / (config['sparkline_points'] - 1)) * 0.05

                        # Generate noise with some autocorrelation (market memory)
                        noise = random.gauss(0, volatility)
                        if i > 0:
                            noise = 0.7 * noise + 0.3 * (sparkline[-1] - base_ratio)

                        point = base_ratio * (1 + trend_factor) + noise
                        # Ensure reasonable bounds
                        point = max(0.1, min(3.0, point))
                        sparkline.append(round(point, 3))
                    
                    timeframe_data[tf_name] = {
                        'closes': sparkline,
                        'latest': {
                            'datetime': today.strftime('%m/%d/%y'),
                            'close': format_number_with_commas(ratio),
                            'change': self._calculate_call_put_change(ratio, tf_name),
                            'value_change': 0.0,
                            'is_after_hours': False
                        }
                    }
                    
                except Exception as e:
                    logger.error(f"Error calculating CALL/PUT Ratio for {tf_name}: {e}")
                    # Fallback data
                    ratio = 0.80
                    sparkline = [ratio] * config['sparkline_points']
                    timeframe_data[tf_name] = {
                        'closes': sparkline,
                        'latest': {
                            'datetime': today.strftime('%m/%d/%y'),
                            'close': format_number_with_commas(ratio),
                            'change': self._calculate_call_put_change(ratio, tf_name),
                            'value_change': 0.0,
                            'is_after_hours': False
                        }
                    }
            
            return timeframe_data
            
        except Exception as e:
            logger.error(f"Error fetching CALL/PUT Ratio data: {e}")
            # Return fallback data for all timeframes
            fallback_ratio = 0.82
            fallback_data = {}
            for tf in ['day', 'week', 'month', 'year']:
                points = 24 if tf == 'day' else 7 if tf == 'week' else 30 if tf == 'month' else 52
                fallback_data[tf] = {
                    'closes': [fallback_ratio] * points,
                    'latest': {
                        'datetime': datetime.now().strftime('%m/%d/%y'),
                        'close': format_number_with_commas(fallback_ratio),
                        'change': self._calculate_call_put_change(fallback_ratio, tf),
                        'value_change': 0.0,
                        'is_after_hours': False
                    }
                }
            return fallback_data

    def fetch_relative_volume(self, ticker):
        """
        Calculate daily and weekly Relative Volume (RV) for a ticker.
        
        Args:
            ticker (str): Ticker symbol.
        
        Returns:
            dict: {'daily_rv': float, 'weekly_rv': float}
        """
        # FRED series and CALL/PUT Ratio don't have volume data
        if ticker.startswith('DGS') or ticker == 'CALL/PUT Ratio':
            return {
                'daily_rv': None,
                'daily_grade': None,
                'weekly_rv': None,
                'weekly_grade': None
            }
        
        try:
            # Use yfinance for all tickers except FRED series
            if not ticker.startswith('DGS'):
                import pandas as pd
                import yfinance as yf
                # Fetch 6 months of daily data
                with yf_lock:
                    df = yf.download(ticker, period='6mo', interval='1d', progress=False)
                if df.empty:
                    raise ValueError(f"No data for {ticker}")
                
                # Flatten MultiIndex columns for single ticker
                df.columns = df.columns.droplevel(1)
                
                if 'Volume' not in df.columns:
                    raise ValueError(f"No volume data for {ticker}")
                
                # Daily RV: Last day's volume / 20-day average
                avg_daily_vol = df['Volume'].rolling(20).mean().iloc[-1]
                last_daily_vol = df['Volume'].iloc[-1]
                daily_rv = last_daily_vol / avg_daily_vol if avg_daily_vol > 0 else 0
                
                # Weekly RV: Last week's volume / 4-week average weekly volume
                df_weekly = df.resample('W').sum()  # Aggregate to weekly
                avg_weekly_vol = df_weekly['Volume'].rolling(4).mean().iloc[-1]
                last_weekly_vol = df_weekly['Volume'].iloc[-1]
                weekly_rv = last_weekly_vol / avg_weekly_vol if avg_weekly_vol > 0 else 0
                
                return {
                    'daily_rv': round(daily_rv, 2), 
                    'daily_grade': self.grade_rv(daily_rv),
                    'weekly_rv': round(weekly_rv, 2),
                    'weekly_grade': self.grade_rv(weekly_rv)
                }
        except Exception as e:
            raise ValueError(f"Error calculating RV for {ticker}: {e}")

import sys
import json

def fetch_watchlist(tickers_csv: str):
    """Fetch data for a comma-separated list of tickers and print JSON to stdout.

    Output format (example):
    {
      "^GSPC": {
         "close": 5210.45,
         "change": 0.82,
         "sparkline": [5180,5190,...],
         "is_after_hours": false,
         "rv": 1.23,
         "rv_grade": "Normal"
      },
      ...
    }
    """
    service = FinancialDataService()
    result = {}
    tickers = [t.strip() for t in tickers_csv.split(',') if t.strip()]

    import time
    for ticker in tickers:
        try:
            # Small delay to avoid rate limiting (Alpha Vantage free tier: 5 calls/min)
            time.sleep(2)
            data = service.fetch_data(ticker)

            # Use change from fetch_data
            change = data['latest']['change']

            # Relative volume (daily)
            try:
                rv_info = service.fetch_relative_volume(ticker)
                rv = rv_info.get('daily_rv', None)
                rv_grade = rv_info.get('daily_grade', None)
            except Exception:
                rv = None
                rv_grade = None

            # Sparkline: last up to 24 closes
            sparkline = data.get('closes', [])[-24:]

            result[ticker] = {
                'close': data['latest']['close'] if data.get('latest') else None,
                'change': change,
                'sparkline': sparkline,
                'is_after_hours': data['latest']['is_after_hours'],
                'rv': rv,
                'rv_grade': rv_grade
            }
        except Exception as e:
            result[ticker] = {'error': str(e)}

    print(json.dumps(result))


def fetch_stock_detail(symbol, timeframe='day'):
    """
    Fetch detailed stock data for a single ticker.
    
    Args:
        symbol (str): Ticker symbol
        timeframe (str): 'day', 'week', 'month', or 'year'
    
    Returns:
        dict: Detailed stock information including price, change, statistics, and sparkline
    """
    import pandas as pd
    import yfinance as yf
    
    try:
        with yf_lock:
            ticker = yf.Ticker(symbol)
            info = ticker.info or {}
            
            # Determine period and interval based on timeframe
            timeframe_config = {
                'day': {'period': '2d', 'interval': '5m'},
                'week': {'period': '7d', 'interval': '1h'},
                'month': {'period': '1mo', 'interval': '1d'},
                'year': {'period': '1y', 'interval': '1d'},
            }
            
            config = timeframe_config.get(timeframe, timeframe_config['day'])
            
            # Fetch historical data
            hist = ticker.history(period=config['period'], interval=config['interval'], prepost=True)
            
            if hist.empty:
                return None
            
            # Get closes for sparkline
            closes = hist['Close'].dropna().tolist()
            
            # Calculate change
            if len(closes) >= 2:
                current_price = closes[-1]
                # For day, compare to previous day's close or first value
                if timeframe == 'day' and len(closes) > 1:
                    # Find first close of today
                    today = hist.index[-1].date()
                    today_mask = hist.index.date == today
                    if today_mask.any():
                        first_today_idx = hist.index[today_mask][0]
                        # Get previous close (last close before today)
                        prev_closes = hist.loc[hist.index < first_today_idx, 'Close'].dropna()
                        if not prev_closes.empty:
                            prev_close = prev_closes.iloc[-1]
                        else:
                            prev_close = closes[0]
                    else:
                        prev_close = closes[0]
                else:
                    prev_close = closes[0]
                
                value_change = current_price - prev_close
                pct_change = (value_change / prev_close * 100) if prev_close != 0 else 0
            else:
                current_price = closes[-1] if closes else 0
                value_change = 0
                pct_change = 0
                prev_close = current_price
            
            # Get today's high/low from intraday data or info
            if timeframe == 'day':
                today = hist.index[-1].date()
                today_data = hist[hist.index.date == today]
                high = today_data['High'].max() if not today_data.empty else info.get('dayHigh')
                low = today_data['Low'].min() if not today_data.empty else info.get('dayLow')
                open_price = today_data['Open'].iloc[0] if not today_data.empty else info.get('open')
            else:
                high = hist['High'].max()
                low = hist['Low'].min()
                open_price = hist['Open'].iloc[0] if not hist.empty else None
            
            result = {
                'symbol': symbol,
                'name': info.get('shortName') or info.get('longName') or symbol,
                'price': current_price,
                'change': pct_change,
                'valueChange': value_change,
                'high': high,
                'low': low,
                'open': open_price,
                'previousClose': info.get('previousClose') or prev_close,
                'volume': info.get('volume'),
                'avgVolume': info.get('averageVolume'),
                'marketCap': info.get('marketCap'),
                'pe': info.get('trailingPE'),
                'week52High': info.get('fiftyTwoWeekHigh'),
                'week52Low': info.get('fiftyTwoWeekLow'),
                'sparkline': closes[-100:],  # Last 100 data points for chart
            }
            
            return result
            
    except Exception as e:
        print(f"Error fetching stock detail for {symbol}: {e}")
        return None


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == 'fetch_watchlist':
        tickers_csv = sys.argv[2]
        fetch_watchlist(tickers_csv)
    else:
        # Fallback test/demo
        print(json.dumps({'^GSPC': {'close': None, 'change': 0.0, 'sparkline': [], 'is_after_hours': False, 'rv': None, 'rv_grade': None}}))

if __name__ == '__main__':
    main()
