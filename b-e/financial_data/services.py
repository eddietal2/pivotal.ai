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
        Fetch latest data with a 24-hour sparkline combining today and yesterday's closes.
        
        Args:
            ticker (str): Ticker symbol (e.g., 'AAPL', '^GSPC') or FRED series (e.g., 'DGS10').
        
        Returns:
            dict: {'closes': [list of close prices], 'datetimes': [list of formatted datetimes], 'latest': {'datetime': str, 'close': float}}
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
                # Get last 30 days
                last_30 = data[-30:]
                closes = [d['value'] for d in last_30]
                
                # Sparkline: last 24 daily closes
                sparkline = closes[-24:] if len(closes) >= 24 else closes
                latest_close = closes[-1]
                latest_datetime = last_30[-1]['date'].strftime('%m/%d/%y - %I:%M %p')
                
                # Change: vs previous day
                change = 0.0
                if len(closes) >= 2:
                    prev_close = closes[-2]
                    change = ((latest_close - prev_close) / prev_close) * 100 if prev_close != 0 else 0.0
                
                is_after_hours = False  # Yields don't have after hours
                
                return {
                    'closes': sparkline,
                    'datetimes': [latest_datetime],
                    'latest': {
                        'datetime': latest_datetime,
                        'close': latest_close,
                        'change': round(change, 2),
                        'is_after_hours': is_after_hours
                    }
                }
            
            # Use yfinance for all tickers except FRED series
            if not ticker.startswith('DGS'):
                import yfinance as yf
                
                # Fetch 2 days of 1-minute data (includes pre/post-market)
                with yf_lock:
                    df = yf.download(ticker, period='2d', interval='1m', prepost=True, progress=False)
                if df.empty:
                    raise ValueError(f"No data found for ticker {ticker}")
                
                # Flatten MultiIndex columns for single ticker
                df.columns = df.columns.droplevel(1)
                
                df.reset_index(inplace=True)
                df['Datetime'] = pd.to_datetime(df['Datetime'])
                # Convert to US/Eastern timezone
                df['Datetime'] = df['Datetime'].dt.tz_convert('US/Eastern')
                df.set_index('Datetime', inplace=True)
                df.sort_index(inplace=True)
                
                # Get all closes in chronological order (oldest to newest)
                all_closes = df['Close'].tolist()
                
                # Sparkline: last 24 closes (or all if less)
                sparkline_24h = all_closes[-24:] if len(all_closes) >= 24 else all_closes
                
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
                
                # Calculate change
                change = 0.0
                if len(all_closes) >= 24:
                    close_24h_ago = all_closes[-25] if len(all_closes) > 25 else all_closes[0]
                    change = ((latest_close - close_24h_ago) / close_24h_ago) * 100 if close_24h_ago != 0 else 0.0
                
                return {
                    'closes': sparkline_24h,
                    'datetimes': [latest_datetime],
                    'latest': {
                        'datetime': latest_datetime,
                        'close': latest_close,
                        'change': round(change, 2),
                        'is_after_hours': is_after_hours
                    }
                }
        except Exception as e:
            raise ValueError(f"Error fetching 24h data for {ticker}: {e}")

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
