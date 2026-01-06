# financial_data/services.py
import requests
import pandas as pd
from os import getenv

class FinancialDataService:
    def __init__(self):
        self.api_key = getenv('AV_API_KEY')
        if not self.api_key:
            raise ValueError("AV_API_KEY environment variable is not set")

    def fetch_historical_data(self, ticker, start_date, end_date):
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker}&apikey={self.api_key}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if 'Time Series (Daily)' not in data:
            raise ValueError(f"No data found for ticker {ticker}")

        time_series = data['Time Series (Daily)']
        records = []
        for date, values in time_series.items():
            if start_date <= date <= end_date:
                records.append({
                    'Date': date,
                    'Open': float(values['1. open']),
                    'High': float(values['2. high']),
                    'Low': float(values['3. low']),
                    'Close': float(values['4. close']),
                    'Volume': int(values['5. volume'])
                })

        df = pd.DataFrame(records)
        df['Date'] = pd.to_datetime(df['Date'])
        df.set_index('Date', inplace=True)
        df.sort_index(inplace=True)
        return df


def main():
    """Test function to run the FinancialDataService in isolation."""
    from dotenv import load_dotenv
    load_dotenv()  # Load environment variables from .env file

    import os
    from datetime import datetime, timedelta

    # Check if API key is set
    api_key = os.getenv('AV_API_KEY')
    if not api_key:
        print("Error: AV_API_KEY environment variable is not set. Please set it to test the service.")
        return

    # Create service instance
    service = FinancialDataService()

    # Test parameters
    ticker = 'AAPL'
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)  # Last 30 days

    try:
        print(f"Fetching data for {ticker} from {start_date} to {end_date}...")
        data = service.fetch_historical_data(ticker, str(start_date), str(end_date))
        print("Data fetched successfully!")
        print(data.head())  # Print first few rows
        print(f"Total records: {len(data)}")
    except Exception as e:
        print(f"Error fetching data: {e}")


if __name__ == "__main__":
    main()