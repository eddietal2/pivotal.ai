from django.test import TestCase, Client
from django.urls import reverse
from decimal import Decimal
import json
from datetime import date, timedelta

from authentication.models import User
from paper_trading.models import (
    PaperTradingAccount, Position, Trade,
    OptionContract, OptionPosition, OptionTrade
)


class PaperTradingAPITests(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create(
            email='test@example.com',
            username='testuser'
        )
        
    def _get_headers(self):
        """Get headers with user email for auth"""
        return {'HTTP_X_USER_EMAIL': self.user.email}
    
    def test_get_account_creates_if_not_exists(self):
        """Test that GET /api/paper-trading/account/ creates an account if it doesn't exist"""
        response = self.client.get('/api/paper-trading/account/', **self._get_headers())
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('account', data)
        self.assertEqual(data['account']['balance'], '100000.00')
        self.assertEqual(data['account']['initial_balance'], '100000.00')
        
    def test_account_requires_auth(self):
        """Test that account endpoint requires authentication"""
        response = self.client.get('/api/paper-trading/account/')
        self.assertEqual(response.status_code, 401)
        
    def test_reset_account(self):
        """Test resetting the paper trading account"""
        # Create initial account
        account = PaperTradingAccount.objects.create(
            user=self.user,
            balance=Decimal('50000'),
            initial_balance=Decimal('100000')
        )
        
        # Reset account
        response = self.client.post(
            '/api/paper-trading/account/',
            data=json.dumps({'initial_balance': 200000}),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['account']['balance'], '200000')
        
    def test_buy_trade(self):
        """Test executing a buy trade"""
        # Create account
        self.client.get('/api/paper-trading/account/', **self._get_headers())
        
        # Execute buy
        response = self.client.post(
            '/api/paper-trading/trades/',
            data=json.dumps({
                'symbol': 'AAPL',
                'name': 'Apple Inc.',
                'side': 'buy',
                'quantity': 10,
                'price': 150.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['trade']['symbol'], 'AAPL')
        self.assertEqual(data['trade']['side'], 'buy')
        self.assertEqual(data['trade']['status'], 'filled')
        
        # Check position was created
        account = PaperTradingAccount.objects.get(user=self.user)
        position = account.positions.get(symbol='AAPL')
        self.assertEqual(position.quantity, Decimal('10'))
        self.assertEqual(position.average_cost, Decimal('150.0000'))
        
        # Check balance was deducted
        self.assertEqual(account.balance, Decimal('98500.00'))  # 100000 - 1500
        
    def test_sell_trade(self):
        """Test executing a sell trade"""
        # Create account with position
        account = PaperTradingAccount.objects.create(
            user=self.user,
            balance=Decimal('90000'),
            initial_balance=Decimal('100000')
        )
        Position.objects.create(
            account=account,
            symbol='AAPL',
            name='Apple Inc.',
            quantity=Decimal('20'),
            average_cost=Decimal('140.00'),
            current_price=Decimal('150.00')
        )
        
        # Execute sell
        response = self.client.post(
            '/api/paper-trading/trades/',
            data=json.dumps({
                'symbol': 'AAPL',
                'side': 'sell',
                'quantity': 10,
                'price': 160.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['trade']['side'], 'sell')
        
        # Check position was reduced
        account.refresh_from_db()
        position = account.positions.get(symbol='AAPL')
        self.assertEqual(position.quantity, Decimal('10'))
        
        # Check balance was increased
        self.assertEqual(account.balance, Decimal('91600.00'))  # 90000 + 1600
        
    def test_sell_all_removes_position(self):
        """Test that selling all shares removes the position"""
        # Create account with position
        account = PaperTradingAccount.objects.create(
            user=self.user,
            balance=Decimal('90000'),
            initial_balance=Decimal('100000')
        )
        Position.objects.create(
            account=account,
            symbol='AAPL',
            name='Apple Inc.',
            quantity=Decimal('10'),
            average_cost=Decimal('140.00'),
            current_price=Decimal('150.00')
        )
        
        # Sell all
        response = self.client.post(
            '/api/paper-trading/trades/',
            data=json.dumps({
                'symbol': 'AAPL',
                'side': 'sell',
                'quantity': 10,
                'price': 150.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        # Check position was removed
        self.assertEqual(account.positions.count(), 0)
        
    def test_insufficient_balance(self):
        """Test that buying with insufficient balance fails"""
        account = PaperTradingAccount.objects.create(
            user=self.user,
            balance=Decimal('100'),
            initial_balance=Decimal('100')
        )
        
        response = self.client.post(
            '/api/paper-trading/trades/',
            data=json.dumps({
                'symbol': 'AAPL',
                'side': 'buy',
                'quantity': 10,
                'price': 150.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertIn('Insufficient balance', data['error'])
        
    def test_insufficient_shares(self):
        """Test that selling more shares than owned fails"""
        account = PaperTradingAccount.objects.create(
            user=self.user,
            balance=Decimal('90000'),
            initial_balance=Decimal('100000')
        )
        Position.objects.create(
            account=account,
            symbol='AAPL',
            name='Apple Inc.',
            quantity=Decimal('5'),
            average_cost=Decimal('140.00'),
            current_price=Decimal('150.00')
        )
        
        response = self.client.post(
            '/api/paper-trading/trades/',
            data=json.dumps({
                'symbol': 'AAPL',
                'side': 'sell',
                'quantity': 10,
                'price': 150.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertIn('Insufficient shares', data['error'])
        
    def test_portfolio_summary(self):
        """Test getting portfolio summary"""
        # Create account with positions and trades
        account = PaperTradingAccount.objects.create(
            user=self.user,
            balance=Decimal('90000'),
            initial_balance=Decimal('100000')
        )
        Position.objects.create(
            account=account,
            symbol='AAPL',
            name='Apple Inc.',
            quantity=Decimal('10'),
            average_cost=Decimal('140.00'),
            current_price=Decimal('150.00')
        )
        Trade.objects.create(
            account=account,
            symbol='AAPL',
            side='buy',
            quantity=Decimal('10'),
            price=Decimal('140.00'),
            total_amount=Decimal('1400.00'),
            status='filled'
        )
        
        response = self.client.get('/api/paper-trading/summary/', **self._get_headers())
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('summary', data)
        self.assertIn('positions', data)
        self.assertIn('recent_trades', data)
        self.assertEqual(len(data['positions']), 1)
        self.assertEqual(len(data['recent_trades']), 1)


class OptionsContractTests(TestCase):
    """Tests for OptionContract model"""
    
    def test_contract_is_expired(self):
        """Test that expired contracts are correctly identified"""
        # Expired contract (yesterday)
        expired_contract = OptionContract.objects.create(
            contract_symbol='AAPL250115C00150000',
            underlying_symbol='AAPL',
            option_type='call',
            strike_price=Decimal('150.00'),
            expiration_date=date.today() - timedelta(days=1),
            multiplier=100
        )
        self.assertTrue(expired_contract.is_expired)
        
        # Future contract
        future_contract = OptionContract.objects.create(
            contract_symbol='AAPL260220C00150000',
            underlying_symbol='AAPL',
            option_type='call',
            strike_price=Decimal('150.00'),
            expiration_date=date.today() + timedelta(days=30),
            multiplier=100
        )
        self.assertFalse(future_contract.is_expired)
        
    def test_days_to_expiration(self):
        """Test days to expiration calculation"""
        contract = OptionContract.objects.create(
            contract_symbol='AAPL260220C00150000',
            underlying_symbol='AAPL',
            option_type='call',
            strike_price=Decimal('150.00'),
            expiration_date=date.today() + timedelta(days=30),
            multiplier=100
        )
        self.assertEqual(contract.days_to_expiration, 30)


class OptionsPositionTests(TestCase):
    """Tests for OptionPosition model calculations"""
    
    def setUp(self):
        self.user = User.objects.create(email='test@example.com', username='testuser')
        self.account = PaperTradingAccount.objects.create(
            user=self.user,
            balance=Decimal('100000'),
            initial_balance=Decimal('100000')
        )
        self.contract = OptionContract.objects.create(
            contract_symbol='AAPL260220C00150000',
            underlying_symbol='AAPL',
            option_type='call',
            strike_price=Decimal('150.00'),
            expiration_date=date.today() + timedelta(days=30),
            multiplier=100
        )
        
    def test_long_position_market_value(self):
        """Test market value for long position"""
        position = OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='long',
            quantity=5,
            average_cost=Decimal('2.50'),
            current_price=Decimal('3.00')
        )
        # 5 contracts * $3.00 * 100 multiplier = $1500
        self.assertEqual(position.market_value, Decimal('1500'))
        
    def test_short_position_market_value(self):
        """Test market value for short position (liability)"""
        position = OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='short',
            quantity=5,
            average_cost=Decimal('2.50'),
            current_price=Decimal('3.00')
        )
        # Short position = negative value (liability)
        self.assertEqual(position.market_value, Decimal('-1500'))
        
    def test_long_position_unrealized_pl(self):
        """Test unrealized P&L for long position"""
        position = OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='long',
            quantity=5,
            average_cost=Decimal('2.50'),
            current_price=Decimal('3.00')
        )
        # Paid $1250 (5 * 2.50 * 100), now worth $1500 = $250 profit
        self.assertEqual(position.unrealized_pl, Decimal('250'))
        
    def test_short_position_unrealized_pl(self):
        """Test unrealized P&L for short position"""
        position = OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='short',
            quantity=5,
            average_cost=Decimal('3.00'),
            current_price=Decimal('2.50')
        )
        # Short position P&L calculation:
        # - Received $1500 premium (5 contracts * $3.00 * 100)
        # - Current liability is $1250 (5 contracts * $2.50 * 100)
        # - Profit = $1500 - $1250 = $250
        self.assertEqual(position.unrealized_pl, Decimal('250.00'))


class OptionsTradeAPITests(TestCase):
    """Tests for options trading API endpoints"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create(email='test@example.com', username='testuser')
        self.account = PaperTradingAccount.objects.create(
            user=self.user,
            balance=Decimal('100000'),
            initial_balance=Decimal('100000')
        )
        self.contract = OptionContract.objects.create(
            contract_symbol='AAPL260220C00150000',
            underlying_symbol='AAPL',
            option_type='call',
            strike_price=Decimal('150.00'),
            expiration_date=date.today() + timedelta(days=30),
            multiplier=100
        )
        
    def _get_headers(self):
        return {'HTTP_X_USER_EMAIL': self.user.email}
    
    def test_create_option_contract(self):
        """Test creating an option contract via API"""
        response = self.client.post(
            '/api/paper-trading/options/contracts/',
            data=json.dumps({
                'contract_symbol': 'AAPL260220P00145000',
                'underlying_symbol': 'AAPL',
                'option_type': 'put',
                'strike_price': 145.00,
                'expiration_date': '2026-02-20',
                'multiplier': 100
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 201)
        
        data = response.json()
        self.assertEqual(data['contract']['underlying_symbol'], 'AAPL')
        self.assertEqual(data['contract']['option_type'], 'put')
        
    def test_get_option_contracts(self):
        """Test fetching option contracts with filter"""
        response = self.client.get(
            '/api/paper-trading/options/contracts/?underlying=AAPL',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('contracts', data)
        self.assertEqual(len(data['contracts']), 1)
        self.assertEqual(data['contracts'][0]['underlying_symbol'], 'AAPL')
        
    def test_buy_to_open_option(self):
        """Test buying to open a long option position"""
        response = self.client.post(
            '/api/paper-trading/options/trades/',
            data=json.dumps({
                'contract_symbol': self.contract.contract_symbol,
                'action': 'buy_to_open',
                'quantity': 5,
                'premium': 2.50
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['trade']['action'], 'buy_to_open')
        self.assertEqual(data['trade']['quantity'], 5)
        
        # Check position was created
        position = OptionPosition.objects.get(account=self.account, contract=self.contract)
        self.assertEqual(position.quantity, 5)
        self.assertEqual(position.position_type, 'long')
        
        # Check balance was deducted (5 contracts * $2.50 * 100 = $1250)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('98750.00'))
        
    def test_sell_to_close_option(self):
        """Test selling to close a long option position"""
        # Create existing long position
        OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='long',
            quantity=10,
            average_cost=Decimal('2.00'),
            current_price=Decimal('2.50')
        )
        
        response = self.client.post(
            '/api/paper-trading/options/trades/',
            data=json.dumps({
                'contract_symbol': self.contract.contract_symbol,
                'action': 'sell_to_close',
                'quantity': 5,
                'premium': 3.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        # Check position was reduced
        position = OptionPosition.objects.get(account=self.account, contract=self.contract)
        self.assertEqual(position.quantity, 5)
        
        # Check balance was credited (5 * $3.00 * 100 = $1500)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('101500.00'))
        
    def test_sell_to_open_option(self):
        """Test selling to open a short option position (writing)"""
        response = self.client.post(
            '/api/paper-trading/options/trades/',
            data=json.dumps({
                'contract_symbol': self.contract.contract_symbol,
                'action': 'sell_to_open',
                'quantity': 3,
                'premium': 2.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        # Check short position was created
        position = OptionPosition.objects.get(account=self.account, contract=self.contract)
        self.assertEqual(position.quantity, 3)
        self.assertEqual(position.position_type, 'short')
        
        # Check balance was credited (received premium: 3 * $2.00 * 100 = $600)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('100600.00'))
        
    def test_buy_to_close_option(self):
        """Test buying to close a short option position"""
        # Create existing short position
        OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='short',
            quantity=5,
            average_cost=Decimal('3.00'),
            current_price=Decimal('2.50')
        )
        
        response = self.client.post(
            '/api/paper-trading/options/trades/',
            data=json.dumps({
                'contract_symbol': self.contract.contract_symbol,
                'action': 'buy_to_close',
                'quantity': 3,
                'premium': 2.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        # Check position was reduced
        position = OptionPosition.objects.get(account=self.account, contract=self.contract)
        self.assertEqual(position.quantity, 2)
        
        # Check balance was deducted (3 * $2.00 * 100 = $600)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('99400.00'))
        
    def test_close_all_removes_position(self):
        """Test that closing entire position removes it"""
        # Create existing long position
        OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='long',
            quantity=5,
            average_cost=Decimal('2.00'),
            current_price=Decimal('2.50')
        )
        
        response = self.client.post(
            '/api/paper-trading/options/trades/',
            data=json.dumps({
                'contract_symbol': self.contract.contract_symbol,
                'action': 'sell_to_close',
                'quantity': 5,
                'premium': 3.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        # Check position was removed
        self.assertEqual(self.account.option_positions.count(), 0)
        
    def test_insufficient_balance_buy_to_open(self):
        """Test that buy_to_open fails with insufficient balance"""
        self.account.balance = Decimal('100')
        self.account.save()
        
        response = self.client.post(
            '/api/paper-trading/options/trades/',
            data=json.dumps({
                'contract_symbol': self.contract.contract_symbol,
                'action': 'buy_to_open',
                'quantity': 10,
                'premium': 5.00  # Would cost $5000
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Insufficient balance', response.json()['error'])
        
    def test_insufficient_contracts_sell_to_close(self):
        """Test that sell_to_close fails when not enough contracts"""
        OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='long',
            quantity=3,
            average_cost=Decimal('2.00'),
            current_price=Decimal('2.50')
        )
        
        response = self.client.post(
            '/api/paper-trading/options/trades/',
            data=json.dumps({
                'contract_symbol': self.contract.contract_symbol,
                'action': 'sell_to_close',
                'quantity': 10,  # More than owned
                'premium': 3.00
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Insufficient contracts', response.json()['error'])
        
    def test_cannot_trade_expired_option(self):
        """Test that trading an expired option fails"""
        expired_contract = OptionContract.objects.create(
            contract_symbol='AAPL250115C00150000',
            underlying_symbol='AAPL',
            option_type='call',
            strike_price=Decimal('150.00'),
            expiration_date=date.today() - timedelta(days=1),
            multiplier=100
        )
        
        response = self.client.post(
            '/api/paper-trading/options/trades/',
            data=json.dumps({
                'contract_symbol': expired_contract.contract_symbol,
                'action': 'buy_to_open',
                'quantity': 5,
                'premium': 2.50
            }),
            content_type='application/json',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('expired', response.json()['error'].lower())
        
    def test_get_option_positions(self):
        """Test fetching option positions"""
        OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='long',
            quantity=5,
            average_cost=Decimal('2.50'),
            current_price=Decimal('3.00')
        )
        
        response = self.client.get(
            '/api/paper-trading/options/positions/',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data['positions']), 1)
        self.assertEqual(data['positions'][0]['quantity'], 5)
        
    def test_get_option_trades(self):
        """Test fetching option trade history"""
        OptionTrade.objects.create(
            account=self.account,
            contract=self.contract,
            action='buy_to_open',
            quantity=5,
            premium=Decimal('2.50'),
            total_amount=Decimal('1250.00'),
            status='filled'
        )
        
        response = self.client.get(
            '/api/paper-trading/options/trades/',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data['trades']), 1)
        self.assertEqual(data['trades'][0]['action'], 'buy_to_open')
        
    def test_options_summary(self):
        """Test fetching options portfolio summary"""
        OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='long',
            quantity=5,
            average_cost=Decimal('2.50'),
            current_price=Decimal('3.00')
        )
        
        response = self.client.get(
            '/api/paper-trading/options/summary/',
            **self._get_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('summary', data)
        self.assertEqual(data['summary']['total_positions'], 1)
        self.assertEqual(data['summary']['long_positions'], 1)
        self.assertEqual(data['summary']['short_positions'], 0)
        
    def test_account_total_value_includes_options(self):
        """Test that account total value includes options positions"""
        # Add stock position
        Position.objects.create(
            account=self.account,
            symbol='AAPL',
            quantity=Decimal('10'),
            average_cost=Decimal('150.00'),
            current_price=Decimal('160.00')
        )
        
        # Add option position
        OptionPosition.objects.create(
            account=self.account,
            contract=self.contract,
            position_type='long',
            quantity=5,
            average_cost=Decimal('2.50'),
            current_price=Decimal('3.00')
        )
        
        # Total value = $100,000 cash + $1,600 stocks (10 * 160) + $1,500 options (5 * 3 * 100)
        self.assertEqual(self.account.total_value, Decimal('103100.00'))
