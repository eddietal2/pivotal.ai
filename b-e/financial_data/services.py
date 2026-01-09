# financial_data/services.py
import pandas as pd
# import yfinance as yf  # Moved inside functions to avoid server startup issues
import pytz  # For timezone handling
import os
import threading
# from alpha_vantage.timeseries import TimeSeries  # Removed Alpha Vantage as it doesn't support indices intraday

# Lock for yfinance calls to prevent concurrent access issues
yf_lock = threading.Lock()

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
            # Handle FRED series for Treasury yields
            if ticker.startswith('DGS'):
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
                        'close': year_closes[-1],
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
                        'close': month_closes[-1],
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
                        'close': week_closes[-1],
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
                        'close': data[-1]['value'],
                        'change': 0.0,  # No change for single point
                        'value_change': 0.0,  # No change for single point
                        'is_after_hours': False
                    }
                }
                
                return timeframe_data
            
            # Use yfinance for all tickers except FRED series
            if not ticker.startswith('DGS'):
                import yfinance as yf
                
                timeframe_data = {}
                
                # Fetch data for different timeframes
                timeframes = {
                    'day': {'period': '2d', 'interval': '5m'},      # 5-minute intervals for day
                    'week': {'period': '5d', 'interval': '1h'},     # 1-hour intervals for week
                    'month': {'period': '1mo', 'interval': '4h'},    # 4-hour intervals for month
                    'year': {'period': '1y', 'interval': '1d'}       # Daily for year
                }
                
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
                        
                        timeframe_data[tf_name] = {
                            'closes': closes,
                            'latest': {
                                'datetime': latest_datetime,
                                'close': latest_close,
                                'change': self._calculate_change(closes, tf_name),
                                'value_change': self._calculate_value_change(closes, tf_name),
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

    def fetch_relative_volume(self, ticker):
        """
        Calculate daily and weekly Relative Volume (RV) for a ticker.
        
        Args:
            ticker (str): Ticker symbol.
        
        Returns:
            dict: {'daily_rv': float, 'weekly_rv': float}
        """
        # FRED series don't have volume data
        if ticker.startswith('DGS'):
            return {
                'daily_rv': None,
                'daily_grade': None,
                'weekly_rv': None,
                'weekly_grade': None
            }
        
        try:
            # Use yfinance for all tickers except FRED series
            if not ticker.startswith('DGS'):
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
                'close': round(data['latest']['close'], 2) if data.get('latest') else None,
                'change': change,
                'sparkline': sparkline,
                'is_after_hours': data['latest']['is_after_hours'],
                'rv': rv,
                'rv_grade': rv_grade
            }
        except Exception as e:
            result[ticker] = {'error': str(e)}

    print(json.dumps(result))

def main():
    if len(sys.argv) >= 3 and sys.argv[1] == 'fetch_watchlist':
        tickers_csv = sys.argv[2]
        fetch_watchlist(tickers_csv)
    else:
        # Fallback test/demo
        print(json.dumps({'^GSPC': {'close': None, 'change': 0.0, 'sparkline': [], 'is_after_hours': False, 'rv': None, 'rv_grade': None}}))

if __name__ == '__main__':
    main()
