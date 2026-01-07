# financial_data/services.py
import pandas as pd
# import yfinance as yf  # Moved inside functions to avoid server startup issues
import pytz  # For timezone handling

# Market Indicator Symbols (yfinance format):
# ----------------------------------------------------------
# GSPC: S&P 500
# DJI: DOW
# IXIC: Nasdaq
# N/A: CALL/PUT Ratio (derived from options data, no single symbol)
# N/A: AAII Retailer Investor Sentiment (survey data, no symbol)
# VIX: VIX (Fear Index)
# TNX: 10-Yr Yield
# BTC-USD: Bitcoin
# GC=F: Gold
# SI=F: Silver
# CL=F: Crude Oil
# RUT: Russell 2000
# IRX: 2-Yr Yield
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
        Fetch intraday data for the most recent complete trading day for a ticker.
        
        Args:
            ticker (str): Ticker symbol (e.g., 'AAPL', '^GSPC').
        
        Returns:
            dict: {'closes': [list of close prices], 'datetimes': [list of formatted datetimes], 'latest': {'datetime': str, 'close': float}}
        """
        try:
            import yfinance as yf
            # Fetch 2 days of data to ensure we have the previous complete day
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
            
            # Get the most recent complete trading day
            # Group by date and find the last complete day (not today if during trading hours)
            df['date'] = df.index.date
            unique_dates = sorted(df['date'].unique())
            
            # If we have at least 2 days, take the second to last (most recent complete day)
            # If only 1 day, take that one
            if len(unique_dates) >= 2:
                complete_day = unique_dates[-2]  # Second to last date
            else:
                complete_day = unique_dates[-1]  # Only day available
            
            # Filter to only the complete day's data
            df_complete = df[df['date'] == complete_day].copy()
            df_complete.drop('date', axis=1, inplace=True)
            
            # Get all close prices for the complete day
            closes = df_complete['Close'].tolist()
            # Get formatted datetimes
            datetimes = [dt.strftime('%m/%d/%y - %I:%M %p') for dt in df_complete.index]
            
            # Get the most recent data from the complete day
            latest = df_complete.iloc[-1]
            latest_datetime = df_complete.index[-1].strftime('%m/%d/%y - %I:%M %p')
            latest_close = float(latest['Close'])
            
            return {
                'closes': closes,
                'datetimes': datetimes,
                'latest': {'datetime': latest_datetime, 'close': latest_close}
            }
        except Exception as e:
            raise ValueError(f"Error fetching data for {ticker}: {e}")

    def fetch_relative_volume(self, ticker):
        """
        Calculate daily and weekly Relative Volume (RV) for a ticker.
        
        Args:
            ticker (str): Ticker symbol.
        
        Returns:
            dict: {'daily_rv': float, 'weekly_rv': float}
        """
        try:
            import yfinance as yf
            # Fetch 6 months of daily data
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

def main():
    """Test function."""
    service = FinancialDataService()
    ticker = '^GSPC'

    try:
        print(f"Fetching most recent data for {ticker}...")
        data = service.fetch_data(ticker)
        print(f"Data fetched successfully!")
        print(f"Number of data points: {len(data['closes'])}")
        print(f"Latest Datetime: {data['latest']['datetime']}")
        print(f"Latest Close Price: {data['latest']['close']}")
        print(f"First few closes: {data['closes'][:5]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
