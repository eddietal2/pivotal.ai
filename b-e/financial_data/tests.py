import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
import custom_console


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
