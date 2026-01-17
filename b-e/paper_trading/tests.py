from django.test import TestCase, Client
from django.urls import reverse
from decimal import Decimal
import json

from authentication.models import User
from paper_trading.models import PaperTradingAccount, Position, Trade


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
