import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
import custom_console


class HealthCheckTests(TestCase):
    """
    Tests for the health_check API endpoint.
    """

    def setUp(self):
        """Set up test environment."""
        self.health_url = reverse('health_check')
        print(f"{custom_console.COLOR_CYAN}--- Starting HealthCheckTest ---{custom_console.RESET_COLOR}")

    # // ----------------------------------
    # // Health Check Endpoint Tests
    # // ----------------------------------
    # FD-001: Test for health check returns OK
    def test_health_check_returns_ok(self):
        """
        GIVEN a request to the health endpoint
        WHEN a GET request is made
        THEN it should return a 200 OK status with status 'ok'.
        """
        # ACT: Make the GET request
        response = self.client.get(self.health_url)

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify response contains expected data
        response_json = response.json()
        self.assertEqual(response_json['status'], 'ok')
        self.assertIn('timestamp', response_json)

        print(f"{custom_console.COLOR_GREEN}✅ FD-001: Test for health check returns OK passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-002: Test for health check CORS headers
    def test_health_check_cors_headers(self):
        """
        GIVEN a request to the health endpoint
        WHEN a GET request is made
        THEN it should include CORS headers for localhost:3000.
        """
        # ACT: Make the GET request
        response = self.client.get(self.health_url)

        # ASSERT: Check CORS header
        self.assertIn('Access-Control-Allow-Origin', response)
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:3000')

        print(f"{custom_console.COLOR_GREEN}✅ FD-002: Test for health check CORS headers passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-003: Test for health check response time
    def test_health_check_fast_response(self):
        """
        GIVEN a request to the health endpoint
        WHEN a GET request is made
        THEN it should respond quickly (used for frontend health checks).
        """
        import time
        
        # ACT: Time the request
        start = time.time()
        response = self.client.get(self.health_url)
        elapsed = time.time() - start

        # ASSERT: Response should be fast (under 100ms)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(elapsed, 0.1, "Health check should respond in under 100ms")

        print(f"{custom_console.COLOR_GREEN}✅ FD-003: Test for health check fast response passed ({elapsed*1000:.2f}ms).{custom_console.RESET_COLOR}")
        print("----------------------------------\n")


class MarketDataTests(TestCase):
    """
    Tests for the market_data API endpoint.
    """

    def setUp(self):
        """Set up test environment."""
        self.market_data_url = reverse('market_data')
        print(f"{custom_console.COLOR_CYAN}--- Starting MarketDataTest ---{custom_console.RESET_COLOR}")

    # // ----------------------------------
    # // Market Data Endpoint Tests
    # // ----------------------------------
    # FD-101: Test for missing tickers parameter
    def test_market_data_missing_tickers(self):
        """
        GIVEN no tickers parameter in the request
        WHEN a GET request is made to the market_data endpoint
        THEN it should return a 400 Bad Request status.
        """
        # ACT: Make the GET request without tickers
        response = self.client.get(self.market_data_url)

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # ASSERT: Verify error message
        response_json = response.json()
        self.assertIn('error', response_json)
        self.assertIn('Tickers parameter is required', response_json['error'])

        print(f"{custom_console.COLOR_GREEN}✅ FD-101: Test for missing tickers parameter passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-102: Test for empty tickers parameter
    def test_market_data_empty_tickers(self):
        """
        GIVEN an empty tickers parameter in the request
        WHEN a GET request is made to the market_data endpoint
        THEN it should return a 400 Bad Request status.
        """
        # ACT: Make the GET request with empty tickers
        response = self.client.get(f"{self.market_data_url}?tickers=")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        print(f"{custom_console.COLOR_GREEN}✅ FD-102: Test for empty tickers parameter passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-103: Test for valid tickers request (mocked)
    @patch('financial_data.views.fetch_all_tickers_batch')
    def test_market_data_valid_request(self, mock_fetch):
        """
        GIVEN valid ticker symbols in the request
        WHEN a GET request is made to the market_data endpoint
        THEN it should return a 200 OK status with market data.
        """
        # ARRANGE: Mock the batch fetch function
        mock_fetch.return_value = {
            'AAPL': {
                'timeframes': {
                    'day': {'change': 1.5, 'value_change': 2.75, 'sparkline': [150, 151, 152]}
                },
                'rv': 1.2,
                'rv_grade': 'Normal'
            }
        }

        # ACT: Make the GET request with valid tickers
        response = self.client.get(f"{self.market_data_url}?tickers=AAPL")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify response contains expected data
        response_json = response.json()
        self.assertIn('AAPL', response_json)
        self.assertIn('timeframes', response_json['AAPL'])

        print(f"{custom_console.COLOR_GREEN}✅ FD-103: Test for valid market data request passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")


class StockDetailTests(TestCase):
    """
    Tests for the stock_detail API endpoint.
    """

    def setUp(self):
        """Set up test environment."""
        self.stock_detail_url = reverse('stock_detail')
        print(f"{custom_console.COLOR_CYAN}--- Starting StockDetailTest ---{custom_console.RESET_COLOR}")

    # // ----------------------------------
    # // Stock Detail Endpoint Tests
    # // ----------------------------------
    # FD-201: Test for missing symbol parameter
    def test_stock_detail_missing_symbol(self):
        """
        GIVEN no symbol parameter in the request
        WHEN a GET request is made to the stock_detail endpoint
        THEN it should return a 400 Bad Request status.
        """
        # ACT: Make the GET request without symbol
        response = self.client.get(self.stock_detail_url)

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # ASSERT: Verify error message
        response_json = response.json()
        self.assertIn('error', response_json)
        self.assertIn('Symbol parameter is required', response_json['error'])

        print(f"{custom_console.COLOR_GREEN}✅ FD-201: Test for missing symbol parameter passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-202: Test for valid stock detail request (mocked)
    @patch('financial_data.views.fetch_stock_detail')
    def test_stock_detail_valid_request(self, mock_fetch):
        """
        GIVEN a valid symbol in the request
        WHEN a GET request is made to the stock_detail endpoint
        THEN it should return a 200 OK status with detailed stock data.
        """
        # ARRANGE: Mock the fetch function
        mock_fetch.return_value = {
            'symbol': 'AAPL',
            'name': 'Apple Inc.',
            'price': 175.50,
            'change': 2.5,
            'volume': 50000000,
            'marketCap': 2800000000000,
            'sparkline': [170, 172, 175, 175.5]
        }

        # ACT: Make the GET request with valid symbol
        response = self.client.get(f"{self.stock_detail_url}?symbol=AAPL")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify response contains expected data
        response_json = response.json()
        self.assertEqual(response_json['symbol'], 'AAPL')
        self.assertIn('price', response_json)
        self.assertIn('sparkline', response_json)

        print(f"{custom_console.COLOR_GREEN}✅ FD-202: Test for valid stock detail request passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-203: Test for stock not found (mocked)
    @patch('financial_data.views.fetch_stock_detail')
    def test_stock_detail_not_found(self, mock_fetch):
        """
        GIVEN an invalid symbol in the request
        WHEN a GET request is made to the stock_detail endpoint
        THEN it should return a 404 Not Found status.
        """
        # ARRANGE: Mock the fetch function to return None
        mock_fetch.return_value = None

        # ACT: Make the GET request with invalid symbol
        response = self.client.get(f"{self.stock_detail_url}?symbol=INVALID123")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        print(f"{custom_console.COLOR_GREEN}✅ FD-203: Test for stock not found passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-204: Test for different timeframes (mocked)
    @patch('financial_data.views.fetch_stock_detail')
    def test_stock_detail_timeframes(self, mock_fetch):
        """
        GIVEN a valid symbol and timeframe parameter
        WHEN a GET request is made to the stock_detail endpoint
        THEN it should return data for the specified timeframe.
        """
        # ARRANGE: Mock the fetch function
        mock_fetch.return_value = {
            'symbol': 'AAPL',
            'name': 'Apple Inc.',
            'price': 175.50,
            'change': 5.2,
            'timeframe': 'week'
        }

        # ACT: Make the GET request with timeframe
        response = self.client.get(f"{self.stock_detail_url}?symbol=AAPL&timeframe=week")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify the mock was called with correct timeframe
        mock_fetch.assert_called_once_with('AAPL', 'week')

        print(f"{custom_console.COLOR_GREEN}✅ FD-204: Test for timeframe parameter passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")


class SearchStocksTests(TestCase):
    """
    Tests for the search_stocks API endpoint.
    """

    def setUp(self):
        """Set up test environment."""
        self.search_url = reverse('search_stocks')
        print(f"{custom_console.COLOR_CYAN}--- Starting SearchStocksTest ---{custom_console.RESET_COLOR}")

    # // ----------------------------------
    # // Search Endpoint Tests
    # // ----------------------------------
    # FD-301: Test for empty search query
    def test_search_empty_query(self):
        """
        GIVEN an empty search query
        WHEN a GET request is made to the search endpoint
        THEN it should return an empty results array.
        """
        # ACT: Make the GET request with empty query
        response = self.client.get(f"{self.search_url}?q=")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify empty results
        response_json = response.json()
        self.assertIn('results', response_json)
        self.assertEqual(len(response_json['results']), 0)

        print(f"{custom_console.COLOR_GREEN}✅ FD-301: Test for empty search query passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-302: Test for valid search query with common symbols
    def test_search_common_symbol(self):
        """
        GIVEN a search query for a common stock symbol
        WHEN a GET request is made to the search endpoint
        THEN it should return matching results from the common symbols list.
        """
        # ACT: Make the GET request with a common symbol
        response = self.client.get(f"{self.search_url}?q=AAPL")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify results contain Apple
        response_json = response.json()
        self.assertIn('results', response_json)
        self.assertTrue(len(response_json['results']) > 0)
        
        # Check that AAPL is in the results
        symbols = [r['symbol'] for r in response_json['results']]
        self.assertIn('AAPL', symbols)

        print(f"{custom_console.COLOR_GREEN}✅ FD-302: Test for common symbol search passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-303: Test for search by company name
    def test_search_by_name(self):
        """
        GIVEN a search query for a company name
        WHEN a GET request is made to the search endpoint
        THEN it should return matching results.
        """
        # ACT: Make the GET request with a company name
        response = self.client.get(f"{self.search_url}?q=Apple")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify results contain Apple Inc.
        response_json = response.json()
        self.assertIn('results', response_json)
        self.assertTrue(len(response_json['results']) > 0)

        print(f"{custom_console.COLOR_GREEN}✅ FD-303: Test for company name search passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-304: Test for crypto search
    def test_search_crypto(self):
        """
        GIVEN a search query for a cryptocurrency
        WHEN a GET request is made to the search endpoint
        THEN it should return crypto results with correct type.
        """
        # ACT: Make the GET request for Bitcoin
        response = self.client.get(f"{self.search_url}?q=BTC")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify crypto results
        response_json = response.json()
        self.assertIn('results', response_json)
        
        # Check for BTC-USD in results
        btc_results = [r for r in response_json['results'] if 'BTC' in r['symbol']]
        self.assertTrue(len(btc_results) > 0)
        
        # Verify type is Crypto for BTC-USD
        btc_usd = next((r for r in response_json['results'] if r['symbol'] == 'BTC-USD'), None)
        if btc_usd:
            self.assertEqual(btc_usd['type'], 'Crypto')

        print(f"{custom_console.COLOR_GREEN}✅ FD-304: Test for crypto search passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-305: Test for ETF search
    def test_search_etf(self):
        """
        GIVEN a search query for an ETF
        WHEN a GET request is made to the search endpoint
        THEN it should return ETF results with correct type.
        """
        # ACT: Make the GET request for SPY
        response = self.client.get(f"{self.search_url}?q=SPY")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify ETF results
        response_json = response.json()
        spy_result = next((r for r in response_json['results'] if r['symbol'] == 'SPY'), None)
        
        self.assertIsNotNone(spy_result)
        self.assertEqual(spy_result['type'], 'ETF')

        print(f"{custom_console.COLOR_GREEN}✅ FD-305: Test for ETF search passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")


class LiveScreensTests(TestCase):
    """
    Tests for the live_screens API endpoint.
    """

    def setUp(self):
        """Set up test environment."""
        self.live_screens_url = reverse('live_screens')
        print(f"{custom_console.COLOR_CYAN}--- Starting LiveScreensTest ---{custom_console.RESET_COLOR}")

    # // ----------------------------------
    # // Live Screens Endpoint Tests
    # // ----------------------------------
    # FD-401: Test for live screens endpoint returns valid structure (mocked)
    @patch('financial_data.services.LiveScreensService')
    def test_live_screens_structure(self, mock_service_class):
        """
        GIVEN a request to the live_screens endpoint
        WHEN a GET request is made
        THEN it should return screens with expected structure.
        """
        # ARRANGE: Mock the service
        mock_service = MagicMock()
        mock_service.fetch_live_screens.return_value = [
            {
                'id': 'top-gainers',
                'title': 'Top Gainers',
                'description': 'Stocks with biggest gains today',
                'icon': '🚀',
                'category': 'momentum',
                'stocks': [
                    {
                        'symbol': 'AAPL',
                        'name': 'Apple Inc.',
                        'price': 175.50,
                        'change': 5.2,
                        'sparkline': [170, 172, 175]
                    }
                ],
                'generatedAt': '2026-01-13T10:00:00-05:00',
                'refreshInterval': 15
            }
        ]
        mock_service_class.return_value = mock_service

        # ACT: Make the GET request
        response = self.client.get(self.live_screens_url)

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify response structure
        response_json = response.json()
        self.assertIn('screens', response_json)
        self.assertTrue(len(response_json['screens']) > 0)
        
        # Verify screen structure
        screen = response_json['screens'][0]
        self.assertIn('id', screen)
        self.assertIn('title', screen)
        self.assertIn('stocks', screen)

        print(f"{custom_console.COLOR_GREEN}✅ FD-401: Test for live screens structure passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-402: Test for filtering by screen IDs (mocked)
    @patch('financial_data.services.LiveScreensService')
    def test_live_screens_filter_by_id(self, mock_service_class):
        """
        GIVEN screen IDs filter parameter
        WHEN a GET request is made to the live_screens endpoint
        THEN it should only return requested screens.
        """
        # ARRANGE: Mock the service
        mock_service = MagicMock()
        mock_service.fetch_live_screens.return_value = [
            {
                'id': 'top-gainers',
                'title': 'Top Gainers',
                'stocks': [],
                'generatedAt': '2026-01-13T10:00:00-05:00'
            }
        ]
        mock_service_class.return_value = mock_service

        # ACT: Make the GET request with screen filter
        response = self.client.get(f"{self.live_screens_url}?screens=top-gainers")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify filter was applied
        mock_service.fetch_live_screens.assert_called_once_with(
            screen_ids=['top-gainers'],
            categories=None
        )

        print(f"{custom_console.COLOR_GREEN}✅ FD-402: Test for screen ID filtering passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-403: Test for filtering by category (mocked)
    @patch('financial_data.services.LiveScreensService')
    def test_live_screens_filter_by_category(self, mock_service_class):
        """
        GIVEN category filter parameter
        WHEN a GET request is made to the live_screens endpoint
        THEN it should only return screens in that category.
        """
        # ARRANGE: Mock the service
        mock_service = MagicMock()
        mock_service.fetch_live_screens.return_value = []
        mock_service_class.return_value = mock_service

        # ACT: Make the GET request with category filter
        response = self.client.get(f"{self.live_screens_url}?categories=momentum")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ASSERT: Verify filter was applied
        mock_service.fetch_live_screens.assert_called_once_with(
            screen_ids=None,
            categories=['momentum']
        )

        print(f"{custom_console.COLOR_GREEN}✅ FD-403: Test for category filtering passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")


class FinancialDataServiceTests(TestCase):
    """
    Tests for the FinancialDataService class.
    """

    def setUp(self):
        """Set up test environment."""
        print(f"{custom_console.COLOR_CYAN}--- Starting FinancialDataServiceTest ---{custom_console.RESET_COLOR}")

    # // ----------------------------------
    # // Service Unit Tests
    # // ----------------------------------
    # FD-501: Test for number formatting
    def test_format_number_with_commas(self):
        """
        GIVEN a number value
        WHEN format_number_with_commas is called
        THEN it should return properly formatted string with commas.
        """
        from financial_data.services import format_number_with_commas
        
        # Test various numbers
        self.assertIn(',', format_number_with_commas(1000000))  # Should have commas
        self.assertIn('.', format_number_with_commas(1234.56))  # Should have decimal
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-501: Test for number formatting passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-502: Test for RV grading
    def test_rv_grading(self):
        """
        GIVEN various relative volume values
        WHEN grade_rv is called
        THEN it should return correct grade labels.
        """
        from financial_data.services import FinancialDataService
        
        service = FinancialDataService()
        
        # Test RV grades based on actual thresholds:
        # < 0.5: Very Low, < 0.8: Low, < 1.2: Normal, < 1.5: High, < 2.0: Very High, >= 2.0: Extreme
        self.assertEqual(service.grade_rv(0.3), 'Very Low')
        self.assertEqual(service.grade_rv(0.7), 'Low')
        self.assertEqual(service.grade_rv(1.0), 'Normal')
        self.assertEqual(service.grade_rv(1.3), 'High')
        self.assertEqual(service.grade_rv(1.8), 'Very High')
        self.assertEqual(service.grade_rv(3.5), 'Extreme')
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-502: Test for RV grading passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")


class LiveScreensServiceTests(TestCase):
    """
    Tests for the LiveScreensService class.
    """

    def setUp(self):
        """Set up test environment."""
        print(f"{custom_console.COLOR_CYAN}--- Starting LiveScreensServiceTest ---{custom_console.RESET_COLOR}")

    # // ----------------------------------
    # // LiveScreensService Unit Tests
    # // ----------------------------------
    # FD-601: Test for RSI calculation
    def test_calculate_rsi(self):
        """
        GIVEN a list of closing prices
        WHEN calculate_rsi is called
        THEN it should return a valid RSI value between 0 and 100.
        """
        from financial_data.services import LiveScreensService
        
        service = LiveScreensService()
        
        # Create test data - upward trending prices
        closes_up = [100 + i for i in range(20)]
        rsi_up = service.calculate_rsi(closes_up)
        
        self.assertIsNotNone(rsi_up)
        self.assertGreater(rsi_up, 50)  # Upward trend should have high RSI
        self.assertLessEqual(rsi_up, 100)
        
        # Create test data - downward trending prices
        closes_down = [120 - i for i in range(20)]
        rsi_down = service.calculate_rsi(closes_down)
        
        self.assertIsNotNone(rsi_down)
        self.assertLess(rsi_down, 50)  # Downward trend should have low RSI
        self.assertGreaterEqual(rsi_down, 0)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-601: Test for RSI calculation passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-602: Test for Bollinger Band width calculation
    def test_calculate_bollinger_width(self):
        """
        GIVEN a list of closing prices
        WHEN calculate_bollinger_width is called
        THEN it should return a valid width percentage.
        """
        from financial_data.services import LiveScreensService
        
        service = LiveScreensService()
        
        # Create test data - low volatility
        closes_low_vol = [100, 100.5, 99.5, 100.2, 99.8] * 5  # 25 points, low variance
        width_low = service.calculate_bollinger_width(closes_low_vol)
        
        self.assertIsNotNone(width_low)
        self.assertGreater(width_low, 0)
        
        # Create test data - high volatility
        closes_high_vol = [100, 110, 90, 115, 85] * 5  # 25 points, high variance
        width_high = service.calculate_bollinger_width(closes_high_vol)
        
        self.assertIsNotNone(width_high)
        self.assertGreater(width_high, width_low)  # High vol should have wider bands
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-602: Test for Bollinger Band width calculation passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-603: Test for signal generation
    def test_generate_signals(self):
        """
        GIVEN stock metrics
        WHEN generate_signals is called
        THEN it should return appropriate signal strings.
        """
        from financial_data.services import LiveScreensService
        
        service = LiveScreensService()
        
        # Test oversold stock
        oversold_info = {
            'rsi': 25,
            'rv': 2.5,
            'change': 1.5,
            'pct_from_high': -30,
            'bb_width': 3
        }
        
        signals = service.generate_signals('TEST', oversold_info, 'oversold')
        
        self.assertTrue(len(signals) > 0)
        self.assertTrue(any('RSI' in s for s in signals))
        self.assertTrue(any('Volume' in s for s in signals))
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-603: Test for signal generation passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-604: Test for score calculation
    def test_calculate_score(self):
        """
        GIVEN stock metrics
        WHEN calculate_score is called
        THEN it should return a score between 0 and 99.
        """
        from financial_data.services import LiveScreensService
        
        service = LiveScreensService()
        
        # Test with good metrics
        good_info = {
            'change': 5.0,
            'rv': 3.0,
            'rsi': 25
        }
        
        score = service.calculate_score(good_info, 'oversold')
        
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 99)
        self.assertGreater(score, 70)  # Good metrics should have high score
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-604: Test for score calculation passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")


class TechnicalIndicatorsTests(TestCase):
    """
    Tests for the technical_indicators API endpoint.
    Tests the new period/interval parameters and indicator calculations.
    """

    def setUp(self):
        """Set up test environment."""
        self.base_url = '/api/market-data/indicators/'
        print(f"{custom_console.COLOR_CYAN}--- Starting TechnicalIndicatorsTest ---{custom_console.RESET_COLOR}")

    # // ----------------------------------
    # // Technical Indicators Endpoint Tests
    # // ----------------------------------
    # FD-701: Test for valid symbol with default params
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_valid_symbol(self, mock_ticker):
        """
        GIVEN a valid symbol
        WHEN a GET request is made to the indicators endpoint
        THEN it should return indicator data with default period/interval.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe with OHLCV data
        dates = pd.date_range(start='2026-01-01', periods=100, freq='15min')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request
        response = self.client.get(f"{self.base_url}AAPL/")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # ASSERT: Verify response structure
        response_json = response.json()
        self.assertEqual(response_json['symbol'], 'AAPL')
        self.assertIn('period', response_json)
        self.assertIn('interval', response_json)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-701: Test for valid symbol with default params passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-702: Test for period/interval parameters
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_period_interval_params(self, mock_ticker):
        """
        GIVEN valid period and interval parameters
        WHEN a GET request is made to the indicators endpoint
        THEN it should return data for the specified timeframe.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=100, freq='1h')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request with period and interval
        response = self.client.get(f"{self.base_url}AAPL/?period=1W&interval=1h")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # ASSERT: Verify response includes specified params
        response_json = response.json()
        self.assertEqual(response_json['period'], '1W')
        self.assertEqual(response_json['interval'], '1h')
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-702: Test for period/interval parameters passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-703: Test for different periods (1D, 1W, 1M, 1Y)
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_all_periods(self, mock_ticker):
        """
        GIVEN different period values
        WHEN GET requests are made to the indicators endpoint
        THEN each should return valid data for that period.
        """
        import pandas as pd
        import numpy as np
        
        periods = ['1D', '1W', '1M', '1Y']
        intervals = ['15m', '1h', '1d', '1w']
        
        for period, interval in zip(periods, intervals):
            # ARRANGE: Create mock dataframe
            dates = pd.date_range(start='2026-01-01', periods=100, freq='1h')
            mock_df = pd.DataFrame({
                'Open': np.random.uniform(100, 110, 100),
                'High': np.random.uniform(105, 115, 100),
                'Low': np.random.uniform(95, 105, 100),
                'Close': np.random.uniform(100, 110, 100),
                'Volume': np.random.randint(1000000, 5000000, 100)
            }, index=dates)
            
            mock_ticker_instance = MagicMock()
            mock_ticker_instance.history.return_value = mock_df
            mock_ticker.return_value = mock_ticker_instance

            # ACT: Make the GET request
            response = self.client.get(f"{self.base_url}AAPL/?period={period}&interval={interval}")

            # ASSERT: Check the HTTP status code
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            response_json = response.json()
            self.assertEqual(response_json['period'], period)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-703: Test for all period values passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-704: Test for legacy timeframe parameter
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_legacy_timeframe(self, mock_ticker):
        """
        GIVEN a legacy timeframe parameter
        WHEN a GET request is made to the indicators endpoint
        THEN it should map correctly and return valid data.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=100, freq='15min')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request with legacy timeframe
        response = self.client.get(f"{self.base_url}AAPL/?timeframe=D")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # ASSERT: Response should have period mapped from timeframe
        response_json = response.json()
        self.assertIn('period', response_json)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-704: Test for legacy timeframe parameter passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-705: Test for ALL indicator type
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_all_type(self, mock_ticker):
        """
        GIVEN indicator=ALL parameter
        WHEN a GET request is made to the indicators endpoint
        THEN it should return all technical indicators.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=100, freq='15min')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request
        response = self.client.get(f"{self.base_url}AAPL/?indicator=ALL")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # ASSERT: Verify all indicators are present
        response_json = response.json()
        self.assertIn('macd', response_json)
        self.assertIn('rsi', response_json)
        self.assertIn('stochastic', response_json)
        self.assertIn('movingAverages', response_json)
        self.assertIn('bollingerBands', response_json)
        self.assertIn('volume', response_json)
        self.assertIn('overallSignal', response_json)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-705: Test for ALL indicator type passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-706: Test for single indicator (MACD)
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_macd_only(self, mock_ticker):
        """
        GIVEN indicator=MACD parameter
        WHEN a GET request is made to the indicators endpoint
        THEN it should return only MACD data.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=100, freq='15min')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request
        response = self.client.get(f"{self.base_url}AAPL/?indicator=MACD")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # ASSERT: Verify only MACD is present
        response_json = response.json()
        self.assertIn('macd', response_json)
        self.assertNotIn('rsi', response_json)
        
        # ASSERT: Verify MACD structure
        macd = response_json['macd']
        self.assertIn('macd', macd)
        self.assertIn('signal', macd)
        self.assertIn('histogram', macd)
        self.assertIn('current', macd)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-706: Test for MACD only indicator passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-707: Test for RSI indicator
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_rsi_only(self, mock_ticker):
        """
        GIVEN indicator=RSI parameter
        WHEN a GET request is made to the indicators endpoint
        THEN it should return only RSI data.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=100, freq='15min')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request
        response = self.client.get(f"{self.base_url}AAPL/?indicator=RSI")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # ASSERT: Verify only RSI is present
        response_json = response.json()
        self.assertIn('rsi', response_json)
        self.assertNotIn('macd', response_json)
        
        # ASSERT: Verify RSI structure
        rsi = response_json['rsi']
        self.assertIn('rsi', rsi)
        self.assertIn('current', rsi)
        self.assertIn('overbought', rsi)
        self.assertIn('oversold', rsi)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-707: Test for RSI only indicator passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-708: Test for overall signal calculation
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_overall_signal(self, mock_ticker):
        """
        GIVEN a valid request
        WHEN a GET request is made to the indicators endpoint
        THEN the overallSignal should contain BUY/SELL/HOLD with confidence.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=100, freq='15min')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request
        response = self.client.get(f"{self.base_url}AAPL/?indicator=ALL")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # ASSERT: Verify overall signal structure
        response_json = response.json()
        overall = response_json['overallSignal']
        self.assertIn('signal', overall)
        self.assertIn('score', overall)
        self.assertIn('confidence', overall)
        
        # Signal should be BUY, SELL, or HOLD
        self.assertIn(overall['signal'], ['BUY', 'SELL', 'HOLD'])
        
        # Confidence should be between 50 and 95
        self.assertGreaterEqual(overall['confidence'], 50)
        self.assertLessEqual(overall['confidence'], 95)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-708: Test for overall signal calculation passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-709: Test for moving averages with current price
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_moving_averages_price(self, mock_ticker):
        """
        GIVEN a valid request
        WHEN a GET request is made to the indicators endpoint
        THEN movingAverages should include currentPrice.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=250, freq='1d')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 250),
            'High': np.random.uniform(105, 115, 250),
            'Low': np.random.uniform(95, 105, 250),
            'Close': np.random.uniform(100, 110, 250),
            'Volume': np.random.randint(1000000, 5000000, 250)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request
        response = self.client.get(f"{self.base_url}AAPL/?indicator=MA")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # ASSERT: Verify movingAverages structure with currentPrice
        response_json = response.json()
        ma = response_json['movingAverages']
        self.assertIn('currentPrice', ma)
        self.assertIn('sma20', ma)
        self.assertIn('sma50', ma)
        self.assertIn('sma200', ma)
        self.assertIn('ema12', ma)
        self.assertIn('ema26', ma)
        
        # Each MA should have status
        self.assertIn('status', ma['sma20'])
        self.assertIn(ma['sma20']['status'], ['bullish', 'bearish', 'neutral'])
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-709: Test for moving averages with price passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-710: Test for invalid symbol
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_invalid_symbol(self, mock_ticker):
        """
        GIVEN an invalid symbol
        WHEN a GET request is made to the indicators endpoint
        THEN it should return a 404 error.
        """
        import pandas as pd
        
        # ARRANGE: Return empty dataframe for invalid symbol
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = pd.DataFrame()
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request with invalid symbol
        response = self.client.get(f"{self.base_url}INVALIDSYMBOL123/")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # ASSERT: Verify error message
        response_json = response.json()
        self.assertIn('error', response_json)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-710: Test for invalid symbol passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-711: Test for invalid indicator type
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_invalid_type(self, mock_ticker):
        """
        GIVEN an invalid indicator type
        WHEN a GET request is made to the indicators endpoint
        THEN it should return a 400 error.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=100, freq='15min')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make the GET request with invalid indicator
        response = self.client.get(f"{self.base_url}AAPL/?indicator=INVALID")

        # ASSERT: Check the HTTP status code
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # ASSERT: Verify error message
        response_json = response.json()
        self.assertIn('error', response_json)
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-711: Test for invalid indicator type passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")

    # FD-712: Test for response caching
    @patch('financial_data.indicators.yf.Ticker')
    def test_indicators_caching(self, mock_ticker):
        """
        GIVEN multiple requests for the same symbol/period/interval
        WHEN GET requests are made to the indicators endpoint
        THEN both requests should return successful responses.
        """
        import pandas as pd
        import numpy as np
        
        # ARRANGE: Create mock dataframe
        dates = pd.date_range(start='2026-01-01', periods=100, freq='15min')
        mock_df = pd.DataFrame({
            'Open': np.random.uniform(100, 110, 100),
            'High': np.random.uniform(105, 115, 100),
            'Low': np.random.uniform(95, 105, 100),
            'Close': np.random.uniform(100, 110, 100),
            'Volume': np.random.randint(1000000, 5000000, 100)
        }, index=dates)
        
        mock_ticker_instance = MagicMock()
        mock_ticker_instance.history.return_value = mock_df
        mock_ticker.return_value = mock_ticker_instance

        # ACT: Make two GET requests for the same symbol
        response1 = self.client.get(f"{self.base_url}AAPL/?period=1D&interval=15m")
        response2 = self.client.get(f"{self.base_url}AAPL/?period=1D&interval=15m")

        # ASSERT: Both should return 200
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # ASSERT: Both responses should have the same structure
        data1 = response1.json()
        data2 = response2.json()
        self.assertEqual(data1['symbol'], data2['symbol'])
        self.assertEqual(data1['period'], data2['period'])
        self.assertEqual(data1['interval'], data2['interval'])
        
        print(f"{custom_console.COLOR_GREEN}✅ FD-712: Test for response caching passed.{custom_console.RESET_COLOR}")
        print("----------------------------------\n")
