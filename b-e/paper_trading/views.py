from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from decimal import Decimal, InvalidOperation
import json

from .models import (
    PaperTradingAccount, Position, Trade, 
    OptionContract, OptionPosition, OptionTrade, OptionStrategy
)
from authentication.models import User


def get_cors_headers():
    """Common CORS headers for all responses"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email',
    }


def cors_response(data, status=200):
    """Create a JSON response with CORS headers"""
    response = JsonResponse(data, status=status)
    for key, value in get_cors_headers().items():
        response[key] = value
    return response


def options_response():
    """Handle OPTIONS preflight requests"""
    response = JsonResponse({})
    for key, value in get_cors_headers().items():
        response[key] = value
    return response


def get_user_from_request(request):
    """Extract user from request (using email from cookie or header)"""
    # Try to get user email from cookie first
    user_email = request.COOKIES.get('user_email')
    
    # Fall back to header if no cookie
    if not user_email:
        user_email = request.headers.get('X-User-Email')
    
    if not user_email:
        return None
    
    try:
        return User.objects.get(email=user_email, is_deleted=False)
    except User.DoesNotExist:
        return None


def get_or_create_account(user):
    """Get or create a paper trading account for a user"""
    account, created = PaperTradingAccount.objects.get_or_create(user=user)
    return account


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def account_view(request):
    """
    GET: Get paper trading account details
    POST: Create/reset paper trading account
    """
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    if request.method == 'GET':
        account = get_or_create_account(user)
        positions = account.positions.all()
        
        # Update positions with current market prices
        if positions.exists():
            try:
                import yfinance as yf
                symbols = [p.symbol for p in positions]
                
                # Fetch current prices for all symbols at once
                for position in positions:
                    try:
                        ticker = yf.Ticker(position.symbol)
                        # Try to get price from fast_info first, then history
                        price = None
                        try:
                            fast_info = ticker.fast_info
                            price = float(fast_info.get('lastPrice', 0) or fast_info.get('last_price', 0) or fast_info.get('regularMarketPrice', 0))
                        except Exception:
                            pass
                        
                        if not price or price <= 0:
                            # Fallback to history
                            hist = ticker.history(period='1d')
                            if not hist.empty:
                                price = float(hist['Close'].iloc[-1])
                        
                        if price and price > 0:
                            position.current_price = Decimal(str(price))
                            position.save()
                    except Exception as e:
                        print(f"Error updating price for {position.symbol}: {e}")
                        # Continue with other positions even if one fails
                        pass
            except Exception as e:
                print(f"Error updating position prices: {e}")
                # Continue with stored prices if update fails
        
        return cors_response({
            'account': {
                'id': account.id,
                'balance': str(account.balance),
                'initial_balance': str(account.initial_balance),
                'total_value': str(account.total_value),
                'total_pl': str(account.total_pl),
                'total_pl_percent': str(account.total_pl_percent),
                'created_at': account.created_at.isoformat(),
            },
            'positions': [
                {
                    'symbol': p.symbol,
                    'name': p.name,
                    'quantity': str(p.quantity),
                    'average_cost': str(p.average_cost),
                    'current_price': str(p.current_price),
                    'market_value': str(p.market_value),
                    'cost_basis': str(p.cost_basis),
                    'unrealized_pl': str(p.unrealized_pl),
                    'unrealized_pl_percent': str(p.unrealized_pl_percent),
                    'opened_at': p.opened_at.isoformat(),
                }
                for p in positions
            ],
        })
    
    elif request.method == 'POST':
        # Reset account
        try:
            data = json.loads(request.body) if request.body else {}
            initial_balance = Decimal(str(data.get('initial_balance', '100000')))
        except (json.JSONDecodeError, InvalidOperation):
            initial_balance = Decimal('100000')
        
        # Delete existing account and positions
        PaperTradingAccount.objects.filter(user=user).delete()
        
        # Create new account
        account = PaperTradingAccount.objects.create(
            user=user,
            balance=initial_balance,
            initial_balance=initial_balance
        )
        
        return cors_response({
            'message': 'Account created/reset successfully',
            'account': {
                'id': account.id,
                'balance': str(account.balance),
                'initial_balance': str(account.initial_balance),
            }
        })


@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def positions_view(request):
    """Get all positions for the user's paper trading account"""
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    account = get_or_create_account(user)
    positions = account.positions.all()
    
    return cors_response({
        'positions': [
            {
                'symbol': p.symbol,
                'name': p.name,
                'quantity': str(p.quantity),
                'average_cost': str(p.average_cost),
                'current_price': str(p.current_price),
                'market_value': str(p.market_value),
                'cost_basis': str(p.cost_basis),
                'unrealized_pl': str(p.unrealized_pl),
                'unrealized_pl_percent': str(p.unrealized_pl_percent),
                'opened_at': p.opened_at.isoformat(),
            }
            for p in positions
        ]
    })


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def update_positions_prices(request):
    """Update current prices for all positions"""
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    try:
        data = json.loads(request.body)
        prices = data.get('prices', {})  # {symbol: price}
    except json.JSONDecodeError:
        return cors_response({'error': 'Invalid JSON'}, status=400)
    
    account = get_or_create_account(user)
    updated_count = 0
    
    for position in account.positions.all():
        if position.symbol in prices:
            try:
                position.current_price = Decimal(str(prices[position.symbol]))
                position.save()
                updated_count += 1
            except (InvalidOperation, TypeError):
                pass
    
    return cors_response({
        'message': f'Updated {updated_count} position prices',
        'updated_count': updated_count,
    })


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def trades_view(request):
    """
    GET: Get trade history
    POST: Execute a new trade
    """
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    account = get_or_create_account(user)
    
    if request.method == 'GET':
        # Get trade history with pagination
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        symbol = request.GET.get('symbol')  # Optional filter by symbol
        
        trades_qs = account.trades.all()
        if symbol:
            trades_qs = trades_qs.filter(symbol=symbol.upper())
        
        total_count = trades_qs.count()
        trades = trades_qs[offset:offset+limit]
        
        return cors_response({
            'trades': [
                {
                    'id': t.id,
                    'symbol': t.symbol,
                    'name': t.name,
                    'side': t.side,
                    'order_type': t.order_type,
                    'quantity': str(t.quantity),
                    'price': str(t.price),
                    'total_amount': str(t.total_amount),
                    'status': t.status,
                    'created_at': t.created_at.isoformat(),
                    'executed_at': t.executed_at.isoformat() if t.executed_at else None,
                }
                for t in trades
            ],
            'total_count': total_count,
            'limit': limit,
            'offset': offset,
        })
    
    elif request.method == 'POST':
        # Execute a trade
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return cors_response({'error': 'Invalid JSON'}, status=400)
        
        # Validate required fields
        required = ['symbol', 'side', 'quantity', 'price']
        for field in required:
            if field not in data:
                return cors_response({'error': f'Missing required field: {field}'}, status=400)
        
        try:
            symbol = data['symbol'].upper()
            name = data.get('name', '')
            side = data['side'].lower()
            quantity = Decimal(str(data['quantity'])).quantize(Decimal('0.000001'))  # 6 decimal places
            price = Decimal(str(data['price'])).quantize(Decimal('0.0001'))  # 4 decimal places
            order_type = data.get('order_type', 'market')
        except (InvalidOperation, AttributeError) as e:
            return cors_response({'error': f'Invalid data format: {str(e)}'}, status=400)
        
        if side not in ['buy', 'sell']:
            return cors_response({'error': 'Side must be "buy" or "sell"'}, status=400)
        
        if quantity <= 0:
            return cors_response({'error': 'Quantity must be greater than 0'}, status=400)
        
        if price <= 0:
            return cors_response({'error': 'Price must be greater than 0'}, status=400)
        
        total_amount = (quantity * price).quantize(Decimal('0.01'))  # Round to cents
        
        if side == 'buy':
            # Check if user has enough balance
            if account.balance < total_amount:
                return cors_response({
                    'error': 'Insufficient balance',
                    'required': str(total_amount),
                    'available': str(account.balance),
                }, status=400)
            
            # Deduct from balance
            account.balance -= total_amount
            account.save()
            
            # Update or create position
            position, created = Position.objects.get_or_create(
                account=account,
                symbol=symbol,
                defaults={
                    'name': name,
                    'quantity': quantity,
                    'average_cost': price,
                    'current_price': price,
                }
            )
            
            if not created:
                # Update existing position - calculate new average cost
                total_cost = (position.quantity * position.average_cost) + total_amount
                position.quantity += quantity
                position.average_cost = total_cost / position.quantity
                position.current_price = price
                if name:
                    position.name = name
                position.save()
        
        else:  # sell
            # Check if user has enough shares
            try:
                position = Position.objects.get(account=account, symbol=symbol)
            except Position.DoesNotExist:
                return cors_response({'error': f'No position in {symbol}'}, status=400)
            
            if position.quantity < quantity:
                return cors_response({
                    'error': 'Insufficient shares',
                    'required': str(quantity),
                    'available': str(position.quantity),
                }, status=400)
            
            # Add to balance
            account.balance += total_amount
            account.save()
            
            # Update position
            position.quantity -= quantity
            position.current_price = price
            
            if position.quantity == 0:
                position.delete()
            else:
                position.save()
        
        # Record the trade
        trade = Trade.objects.create(
            account=account,
            symbol=symbol,
            name=name,
            side=side,
            order_type=order_type,
            quantity=quantity,
            price=price,
            total_amount=total_amount,
            status='filled',
            executed_at=timezone.now(),
        )
        
        return cors_response({
            'message': f'{side.upper()} order executed',
            'trade': {
                'id': trade.id,
                'symbol': trade.symbol,
                'side': trade.side,
                'quantity': str(trade.quantity),
                'price': str(trade.price),
                'total_amount': str(trade.total_amount),
                'status': trade.status,
                'executed_at': trade.executed_at.isoformat(),
            },
            'account': {
                'balance': str(account.balance),
                'total_value': str(account.total_value),
            }
        })


@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def portfolio_summary(request):
    """Get a summary of the paper trading portfolio"""
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    account = get_or_create_account(user)
    positions = account.positions.all()
    trades = account.trades.all()
    
    # Calculate metrics
    total_trades = trades.count()
    winning_trades = trades.filter(side='sell').count()  # Simplified - would need realized P&L tracking
    
    positions_data = [
        {
            'symbol': p.symbol,
            'name': p.name,
            'quantity': str(p.quantity),
            'average_cost': str(p.average_cost),
            'current_price': str(p.current_price),
            'market_value': str(p.market_value),
            'unrealized_pl': str(p.unrealized_pl),
            'unrealized_pl_percent': str(p.unrealized_pl_percent),
            'weight': str((p.market_value / account.total_value * 100) if account.total_value > 0 else 0),
        }
        for p in positions
    ]
    
    return cors_response({
        'summary': {
            'cash_balance': str(account.balance),
            'positions_value': str(sum(p.market_value for p in positions)),
            'total_value': str(account.total_value),
            'initial_balance': str(account.initial_balance),
            'total_pl': str(account.total_pl),
            'total_pl_percent': str(account.total_pl_percent),
            'positions_count': positions.count(),
            'total_trades': total_trades,
        },
        'positions': positions_data,
        'recent_trades': [
            {
                'id': t.id,
                'symbol': t.symbol,
                'side': t.side,
                'quantity': str(t.quantity),
                'price': str(t.price),
                'total_amount': str(t.total_amount),
                'executed_at': t.executed_at.isoformat() if t.executed_at else t.created_at.isoformat(),
            }
            for t in trades[:10]  # Last 10 trades
        ],
    })


# ============================================
# OPTIONS TRADING VIEWS
# ============================================

def serialize_option_contract(contract):
    """Serialize an OptionContract to dict"""
    # Handle both date objects and string dates
    exp_date = contract.expiration_date
    if hasattr(exp_date, 'isoformat'):
        exp_date = exp_date.isoformat()
    
    return {
        'id': contract.id,
        'contract_symbol': contract.contract_symbol,
        'underlying_symbol': contract.underlying_symbol,
        'option_type': contract.option_type,
        'strike_price': str(contract.strike_price),
        'expiration_date': exp_date,
        'multiplier': contract.multiplier,
        'is_expired': contract.is_expired,
        'days_to_expiration': contract.days_to_expiration,
    }


def serialize_option_position(position, daily_change_data=None):
    """Serialize an OptionPosition to dict"""
    data = {
        'id': position.id,
        'contract': serialize_option_contract(position.contract),
        'position_type': position.position_type,
        'quantity': position.quantity,
        'average_cost': str(position.average_cost),
        'current_price': str(position.current_price),
        'market_value': str(position.market_value),
        'cost_basis': str(position.cost_basis),
        'unrealized_pl': str(position.unrealized_pl),
        'unrealized_pl_percent': str(position.unrealized_pl_percent),
        'opened_at': position.opened_at.isoformat(),
        'daily_change': '0',
        'daily_change_percent': '0',
    }
    
    # Add daily change data if available
    if daily_change_data and position.contract.contract_symbol in daily_change_data:
        change_info = daily_change_data[position.contract.contract_symbol]
        data['daily_change'] = str(change_info.get('change', 0))
        data['daily_change_percent'] = str(change_info.get('change_percent', 0))
    
    return data


def serialize_option_trade(trade):
    """Serialize an OptionTrade to dict"""
    return {
        'id': trade.id,
        'contract': serialize_option_contract(trade.contract),
        'action': trade.action,
        'order_type': trade.order_type,
        'quantity': trade.quantity,
        'premium': str(trade.premium),
        'total_amount': str(trade.total_amount),
        'commission': str(trade.commission),
        'status': trade.status,
        'created_at': trade.created_at.isoformat(),
        'executed_at': trade.executed_at.isoformat() if trade.executed_at else None,
        'notes': trade.notes,
    }


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def option_contracts_view(request):
    """
    GET: Get option contracts (with optional filtering)
    POST: Create a new option contract (for paper trading)
    """
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    if request.method == 'GET':
        underlying = request.GET.get('underlying')
        option_type = request.GET.get('type')  # call or put
        expiration = request.GET.get('expiration')  # YYYY-MM-DD
        
        contracts_qs = OptionContract.objects.all()
        
        if underlying:
            contracts_qs = contracts_qs.filter(underlying_symbol=underlying.upper())
        if option_type:
            contracts_qs = contracts_qs.filter(option_type=option_type.lower())
        if expiration:
            contracts_qs = contracts_qs.filter(expiration_date=expiration)
        
        return cors_response({
            'contracts': [serialize_option_contract(c) for c in contracts_qs[:100]]
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return cors_response({'error': 'Invalid JSON'}, status=400)
        
        required = ['underlying_symbol', 'option_type', 'strike_price', 'expiration_date', 'contract_symbol']
        for field in required:
            if field not in data:
                return cors_response({'error': f'Missing required field: {field}'}, status=400)
        
        try:
            contract, created = OptionContract.objects.get_or_create(
                contract_symbol=data['contract_symbol'],
                defaults={
                    'underlying_symbol': data['underlying_symbol'].upper(),
                    'option_type': data['option_type'].lower(),
                    'strike_price': Decimal(str(data['strike_price'])),
                    'expiration_date': data['expiration_date'],
                    'multiplier': int(data.get('multiplier', 100)),
                }
            )
        except Exception as e:
            return cors_response({'error': str(e)}, status=400)
        
        return cors_response({
            'message': 'Contract created' if created else 'Contract already exists',
            'contract': serialize_option_contract(contract),
        }, status=201 if created else 200)


@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def option_positions_view(request):
    """Get all option positions for the user's paper trading account"""
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    account = get_or_create_account(user)
    positions = account.option_positions.select_related('contract').all()
    
    # Dictionary to store daily change data for each contract
    daily_change_data = {}
    
    # Update option positions with current market prices
    if positions.exists():
        try:
            import yfinance as yf
            from datetime import date
            
            # Group positions by underlying symbol to minimize API calls
            underlying_symbols = set(p.contract.underlying_symbol for p in positions)
            
            for underlying in underlying_symbols:
                try:
                    ticker = yf.Ticker(underlying)
                    # Get all option chains for this underlying
                    expirations = ticker.options
                    
                    for position in positions:
                        if position.contract.underlying_symbol != underlying:
                            continue
                        
                        exp_date = position.contract.expiration_date.strftime('%Y-%m-%d')
                        
                        # Check if option is expired
                        if position.contract.expiration_date < date.today():
                            # Option has expired - set current_price to 0 for expired worthless, or intrinsic value
                            # For simplicity, we'll set expired OTM options to 0
                            try:
                                # Get current underlying price
                                underlying_price = float(ticker.fast_info.get('lastPrice', 0) or 0)
                                if not underlying_price:
                                    hist = ticker.history(period='1d')
                                    if not hist.empty:
                                        underlying_price = float(hist['Close'].iloc[-1])
                                
                                strike = float(position.contract.strike_price)
                                if position.contract.option_type == 'call':
                                    # Call: intrinsic = max(0, underlying - strike)
                                    intrinsic = max(0, underlying_price - strike)
                                else:
                                    # Put: intrinsic = max(0, strike - underlying)
                                    intrinsic = max(0, strike - underlying_price)
                                
                                position.current_price = Decimal(str(round(intrinsic, 2)))
                                position.save()
                                
                                # Mark as expired with 0 daily change
                                daily_change_data[position.contract.contract_symbol] = {
                                    'change': 0,
                                    'change_percent': 0,
                                    'expired': True,
                                }
                            except Exception as e:
                                print(f"Error calculating intrinsic for expired option {position.contract.contract_symbol}: {e}")
                            continue
                        
                        if exp_date in expirations:
                            try:
                                chain = ticker.option_chain(exp_date)
                                option_type = position.contract.option_type
                                strike = float(position.contract.strike_price)
                                
                                if option_type == 'call':
                                    df = chain.calls
                                else:
                                    df = chain.puts
                                
                                # Find the contract with matching strike
                                matching = df[abs(df['strike'] - strike) < 0.01]
                                if not matching.empty:
                                    row = matching.iloc[0]
                                    # Use mark price (mid of bid/ask) or last price
                                    bid = float(row.get('bid', 0) or 0)
                                    ask = float(row.get('ask', 0) or 0)
                                    last = float(row.get('lastPrice', 0) or 0)
                                    
                                    if bid > 0 and ask > 0:
                                        premium = (bid + ask) / 2
                                    elif last > 0:
                                        premium = last
                                    else:
                                        premium = None
                                    
                                    if premium and premium > 0:
                                        position.current_price = Decimal(str(round(premium, 2)))
                                        position.save()
                                    
                                    # Capture daily change data from yfinance
                                    change = float(row.get('change', 0) or 0)
                                    percent_change = float(row.get('percentChange', 0) or 0)
                                    
                                    # If percentChange not available, calculate from previous close
                                    if percent_change == 0 and last > 0:
                                        prev_close = last - change
                                        if prev_close > 0:
                                            percent_change = (change / prev_close) * 100
                                    
                                    daily_change_data[position.contract.contract_symbol] = {
                                        'change': round(change, 2),
                                        'change_percent': round(percent_change, 2),
                                    }
                            except Exception as e:
                                print(f"Error fetching option price for {position.contract.contract_symbol}: {e}")
                except Exception as e:
                    print(f"Error fetching options for {underlying}: {e}")
        except Exception as e:
            print(f"Error updating option prices: {e}")
    
    # Refresh positions after price updates
    positions = account.option_positions.select_related('contract').all()
    
    # Calculate totals
    total_value = sum(p.market_value for p in positions)
    total_pl = sum(p.unrealized_pl for p in positions)
    
    return cors_response({
        'positions': [serialize_option_position(p, daily_change_data) for p in positions],
        'summary': {
            'total_positions': positions.count(),
            'total_market_value': str(total_value),
            'total_unrealized_pl': str(total_pl),
        }
    })


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def update_option_positions_prices(request):
    """Update current prices for option positions"""
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    try:
        data = json.loads(request.body)
        prices = data.get('prices', {})  # {contract_symbol: premium}
    except json.JSONDecodeError:
        return cors_response({'error': 'Invalid JSON'}, status=400)
    
    account = get_or_create_account(user)
    updated_count = 0
    
    for position in account.option_positions.select_related('contract').all():
        if position.contract.contract_symbol in prices:
            try:
                position.current_price = Decimal(str(prices[position.contract.contract_symbol]))
                position.save()
                updated_count += 1
            except (InvalidOperation, TypeError):
                pass
    
    return cors_response({
        'message': f'Updated {updated_count} option position prices',
        'updated_count': updated_count,
    })


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def option_trades_view(request):
    """
    GET: Get option trade history
    POST: Execute a new option trade
    """
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    account = get_or_create_account(user)
    
    if request.method == 'GET':
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        underlying = request.GET.get('underlying')
        
        trades_qs = account.option_trades.select_related('contract').all()
        if underlying:
            trades_qs = trades_qs.filter(contract__underlying_symbol=underlying.upper())
        
        total_count = trades_qs.count()
        trades = trades_qs[offset:offset+limit]
        
        return cors_response({
            'trades': [serialize_option_trade(t) for t in trades],
            'total_count': total_count,
            'limit': limit,
            'offset': offset,
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return cors_response({'error': 'Invalid JSON'}, status=400)
        
        # Validate required fields
        required = ['contract_symbol', 'action', 'quantity', 'premium']
        for field in required:
            if field not in data:
                return cors_response({'error': f'Missing required field: {field}'}, status=400)
        
        try:
            contract_symbol = data['contract_symbol']
            action = data['action'].lower()  # buy_to_open, sell_to_close, etc.
            quantity = int(data['quantity'])
            premium = Decimal(str(data['premium']))  # Premium per share
            order_type = data.get('order_type', 'market')
            commission = Decimal(str(data.get('commission', '0')))
        except (InvalidOperation, ValueError) as e:
            return cors_response({'error': f'Invalid data format: {str(e)}'}, status=400)
        
        valid_actions = ['buy_to_open', 'sell_to_close', 'sell_to_open', 'buy_to_close']
        if action not in valid_actions:
            return cors_response({'error': f'Action must be one of: {", ".join(valid_actions)}'}, status=400)
        
        if quantity <= 0:
            return cors_response({'error': 'Quantity must be greater than 0'}, status=400)
        
        if premium < 0:
            return cors_response({'error': 'Premium cannot be negative'}, status=400)
        
        # Get or create the contract
        try:
            contract = OptionContract.objects.get(contract_symbol=contract_symbol)
        except OptionContract.DoesNotExist:
            # If contract doesn't exist, try to create it from provided data
            contract_data = data.get('contract')
            if not contract_data:
                return cors_response({'error': f'Contract {contract_symbol} not found. Provide contract details.'}, status=400)
            
            try:
                contract = OptionContract.objects.create(
                    contract_symbol=contract_symbol,
                    underlying_symbol=contract_data['underlying_symbol'].upper(),
                    option_type=contract_data['option_type'].lower(),
                    strike_price=Decimal(str(contract_data['strike_price'])),
                    expiration_date=contract_data['expiration_date'],
                    multiplier=int(contract_data.get('multiplier', 100)),
                )
            except Exception as e:
                return cors_response({'error': f'Failed to create contract: {str(e)}'}, status=400)
        
        # Check if contract is expired
        if contract.is_expired:
            return cors_response({'error': 'Cannot trade expired option'}, status=400)
        
        multiplier = contract.multiplier
        total_amount = quantity * premium * multiplier + commission
        
        if action == 'buy_to_open':
            # Buying to open a long position - requires cash
            if account.balance < total_amount:
                return cors_response({
                    'error': 'Insufficient balance',
                    'required': str(total_amount),
                    'available': str(account.balance),
                }, status=400)
            
            # Deduct from balance
            account.balance -= total_amount
            account.save()
            
            # Create or update position
            position, created = OptionPosition.objects.get_or_create(
                account=account,
                contract=contract,
                position_type='long',
                defaults={
                    'quantity': quantity,
                    'average_cost': premium,
                    'current_price': premium,
                }
            )
            
            if not created:
                # Update existing position
                total_cost = (position.quantity * position.average_cost) + (quantity * premium)
                position.quantity += quantity
                position.average_cost = total_cost / position.quantity
                position.current_price = premium
                position.save()
        
        elif action == 'sell_to_close':
            # Selling to close a long position
            try:
                position = OptionPosition.objects.get(
                    account=account,
                    contract=contract,
                    position_type='long'
                )
            except OptionPosition.DoesNotExist:
                return cors_response({'error': f'No long position in {contract_symbol}'}, status=400)
            
            if position.quantity < quantity:
                return cors_response({
                    'error': 'Insufficient contracts',
                    'required': quantity,
                    'available': position.quantity,
                }, status=400)
            
            # Add to balance (minus commission)
            proceeds = quantity * premium * multiplier - commission
            account.balance += proceeds
            account.save()
            
            # Update position
            position.quantity -= quantity
            position.current_price = premium
            
            if position.quantity == 0:
                position.delete()
            else:
                position.save()
        
        elif action == 'sell_to_open':
            # Selling to open a short position (writing options)
            # Receives premium but may need margin (simplified: just track the position)
            proceeds = quantity * premium * multiplier - commission
            account.balance += proceeds
            account.save()
            
            # Create or update short position
            position, created = OptionPosition.objects.get_or_create(
                account=account,
                contract=contract,
                position_type='short',
                defaults={
                    'quantity': quantity,
                    'average_cost': premium,
                    'current_price': premium,
                }
            )
            
            if not created:
                total_premium = (position.quantity * position.average_cost) + (quantity * premium)
                position.quantity += quantity
                position.average_cost = total_premium / position.quantity
                position.current_price = premium
                position.save()
        
        elif action == 'buy_to_close':
            # Buying to close a short position
            try:
                position = OptionPosition.objects.get(
                    account=account,
                    contract=contract,
                    position_type='short'
                )
            except OptionPosition.DoesNotExist:
                return cors_response({'error': f'No short position in {contract_symbol}'}, status=400)
            
            if position.quantity < quantity:
                return cors_response({
                    'error': 'Insufficient contracts',
                    'required': quantity,
                    'available': position.quantity,
                }, status=400)
            
            # Deduct from balance
            if account.balance < total_amount:
                return cors_response({
                    'error': 'Insufficient balance',
                    'required': str(total_amount),
                    'available': str(account.balance),
                }, status=400)
            
            account.balance -= total_amount
            account.save()
            
            # Update position
            position.quantity -= quantity
            position.current_price = premium
            
            if position.quantity == 0:
                position.delete()
            else:
                position.save()
        
        # Record the trade
        trade = OptionTrade.objects.create(
            account=account,
            contract=contract,
            action=action,
            order_type=order_type,
            quantity=quantity,
            premium=premium,
            total_amount=total_amount,
            commission=commission,
            status='filled',
            executed_at=timezone.now(),
        )
        
        return cors_response({
            'message': f'{action.replace("_", " ").title()} order executed',
            'trade': serialize_option_trade(trade),
            'account': {
                'balance': str(account.balance),
                'total_value': str(account.total_value),
            }
        })


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def close_expired_position(request):
    """
    Close an expired option position at its settlement value.
    For ITM options, settles at intrinsic value. For OTM options, settles at $0.
    
    POST /api/paper-trading/options/close-expired/
    Body: {"position_id": 123} or {"contract_symbol": "RIOT260123C00016500"}
    """
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return cors_response({'error': 'Invalid JSON'}, status=400)
    
    account = get_or_create_account(user)
    
    # Find the position by ID or contract symbol
    position_id = data.get('position_id')
    contract_symbol = data.get('contract_symbol')
    
    if position_id:
        try:
            position = OptionPosition.objects.get(id=position_id, account=account)
        except OptionPosition.DoesNotExist:
            return cors_response({'error': 'Position not found'}, status=404)
    elif contract_symbol:
        try:
            position = OptionPosition.objects.get(
                account=account,
                contract__contract_symbol=contract_symbol
            )
        except OptionPosition.DoesNotExist:
            return cors_response({'error': f'No position found for {contract_symbol}'}, status=404)
    else:
        return cors_response({'error': 'Provide position_id or contract_symbol'}, status=400)
    
    contract = position.contract
    
    # Verify the contract is expired
    if not contract.is_expired:
        return cors_response({'error': 'Contract is not expired. Use regular trade endpoint.'}, status=400)
    
    # Calculate settlement value
    # Need to get the underlying's current/last price
    settlement_price = Decimal('0')
    intrinsic_value = Decimal('0')
    
    try:
        import yfinance as yf
        ticker = yf.Ticker(contract.underlying_symbol)
        underlying_price = Decimal(str(ticker.info.get('regularMarketPrice', 0) or ticker.info.get('previousClose', 0)))
        
        if underlying_price > 0:
            if contract.option_type == 'call':
                intrinsic_value = max(Decimal('0'), underlying_price - contract.strike_price)
            else:  # put
                intrinsic_value = max(Decimal('0'), contract.strike_price - underlying_price)
            
            settlement_price = intrinsic_value
    except Exception as e:
        print(f"Error fetching underlying price for settlement: {e}")
        # Default to 0 if we can't get the price
        settlement_price = Decimal('0')
    
    # Calculate the settlement amount
    multiplier = contract.multiplier
    quantity = position.quantity
    
    # For long positions: receive the settlement value
    # For short positions: pay the settlement value
    if position.position_type == 'long':
        settlement_amount = quantity * settlement_price * multiplier
        account.balance += settlement_amount
        realized_pl = settlement_amount - (quantity * position.average_cost * multiplier)
    else:  # short
        settlement_amount = quantity * settlement_price * multiplier
        account.balance -= settlement_amount
        realized_pl = (quantity * position.average_cost * multiplier) - settlement_amount
    
    account.save()
    
    # Record as a trade
    action = 'sell_to_close' if position.position_type == 'long' else 'buy_to_close'
    trade = OptionTrade.objects.create(
        account=account,
        contract=contract,
        action=action,
        order_type='market',
        quantity=quantity,
        premium=settlement_price,
        total_amount=settlement_amount,
        commission=Decimal('0'),
        status='filled',
        executed_at=timezone.now(),
    )
    
    # Delete the position
    position.delete()
    
    return cors_response({
        'message': f'Expired position closed at ${settlement_price:.2f} per share (intrinsic value)',
        'settlement': {
            'contract_symbol': contract.contract_symbol,
            'underlying_symbol': contract.underlying_symbol,
            'option_type': contract.option_type,
            'strike_price': str(contract.strike_price),
            'settlement_price': str(settlement_price),
            'quantity': quantity,
            'total_settlement': str(settlement_amount),
            'realized_pl': str(realized_pl),
        },
        'trade': serialize_option_trade(trade),
        'account': {
            'balance': str(account.balance),
            'total_value': str(account.total_value),
        }
    })


@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def options_summary_view(request):
    """Get a summary of options positions and activity"""
    if request.method == 'OPTIONS':
        return options_response()
    
    user = get_user_from_request(request)
    if not user:
        return cors_response({'error': 'Authentication required'}, status=401)
    
    account = get_or_create_account(user)
    positions = account.option_positions.select_related('contract').all()
    trades = account.option_trades.select_related('contract').all()
    
    # Separate long and short positions
    long_positions = [p for p in positions if p.position_type == 'long']
    short_positions = [p for p in positions if p.position_type == 'short']
    
    # Group by underlying
    underlyings = {}
    for p in positions:
        sym = p.contract.underlying_symbol
        if sym not in underlyings:
            underlyings[sym] = {'long': [], 'short': []}
        underlyings[sym][p.position_type].append(serialize_option_position(p))
    
    return cors_response({
        'summary': {
            'total_positions': positions.count(),
            'long_positions': len(long_positions),
            'short_positions': len(short_positions),
            'total_market_value': str(sum(p.market_value for p in positions)),
            'long_value': str(sum(p.market_value for p in long_positions)),
            'short_value': str(sum(p.market_value for p in short_positions)),
            'total_unrealized_pl': str(sum(p.unrealized_pl for p in positions)),
            'total_trades': trades.count(),
        },
        'positions_by_underlying': underlyings,
        'recent_trades': [serialize_option_trade(t) for t in trades[:10]],
    })


# ============================================
# OPTIONS CHAIN - FETCH FROM YAHOO FINANCE
# ============================================

@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def options_chain_view(request):
    """
    Fetch real options chain data for a symbol from Yahoo Finance.
    Auto-creates contracts in the database for paper trading.
    
    GET /api/paper-trading/options/chain/?symbol=IAU
    GET /api/paper-trading/options/chain/?symbol=IAU&expiration=2026-02-21
    
    Returns available expirations and full options chain with bid/ask/volume.
    """
    if request.method == "OPTIONS":
        return options_response()
    
    symbol = request.GET.get('symbol', '').upper()
    if not symbol:
        return cors_response({'error': 'Symbol parameter required'}, status=400)
    
    expiration = request.GET.get('expiration')  # Optional: specific expiration date
    
    try:
        import yfinance as yf
        import pandas as pd
        
        ticker = yf.Ticker(symbol)
        
        # Get available expiration dates
        try:
            expirations = ticker.options
        except Exception:
            expirations = []
        
        if not expirations:
            return cors_response({
                'error': f'No options available for {symbol}',
                'symbol': symbol,
                'expirations': [],
                'contracts': []
            }, status=404)
        
        # Use requested expiration or default to first available
        selected_expiration = expiration if expiration in expirations else expirations[0]
        
        # Fetch options chain for selected expiration
        try:
            opt_chain = ticker.option_chain(selected_expiration)
            calls_df = opt_chain.calls
            puts_df = opt_chain.puts
        except Exception as e:
            return cors_response({
                'error': f'Failed to fetch options chain: {str(e)}',
                'symbol': symbol,
                'expirations': list(expirations),
            }, status=500)
        
        contracts = []
        
        # Process CALLS
        for _, row in calls_df.iterrows():
            contract_symbol = row.get('contractSymbol', '')
            if not contract_symbol:
                continue
            
            strike = float(row['strike']) if pd.notna(row.get('strike')) else 0
            bid = float(row['bid']) if pd.notna(row.get('bid')) else 0
            ask = float(row['ask']) if pd.notna(row.get('ask')) else 0
            last = float(row['lastPrice']) if pd.notna(row.get('lastPrice')) else 0
            volume = int(row['volume']) if pd.notna(row.get('volume')) else 0
            open_interest = int(row['openInterest']) if pd.notna(row.get('openInterest')) else 0
            iv = float(row['impliedVolatility']) if pd.notna(row.get('impliedVolatility')) else 0
            change = float(row['change']) if pd.notna(row.get('change')) else 0
            percent_change = float(row['percentChange']) if pd.notna(row.get('percentChange')) else 0
            
            # Auto-create contract in database (get_or_create to avoid duplicates)
            contract_obj, created = OptionContract.objects.get_or_create(
                contract_symbol=contract_symbol,
                defaults={
                    'underlying_symbol': symbol,
                    'option_type': 'call',
                    'strike_price': strike,
                    'expiration_date': selected_expiration,
                    'multiplier': 100,
                }
            )
            
            contracts.append({
                'contract_symbol': contract_symbol,
                'underlying_symbol': symbol,
                'option_type': 'call',
                'strike': strike,
                'expiration': selected_expiration,
                'bid': bid,
                'ask': ask,
                'last': last,
                'mark': round((bid + ask) / 2, 2) if bid and ask else last,
                'volume': volume,
                'open_interest': open_interest,
                'implied_volatility': round(iv * 100, 2),  # Convert to percentage
                'in_the_money': row.get('inTheMoney', False),
                'change': round(change, 2),
                'percent_change': round(percent_change, 2),
                'created': created,
            })
        
        # Process PUTS
        for _, row in puts_df.iterrows():
            contract_symbol = row.get('contractSymbol', '')
            if not contract_symbol:
                continue
            
            strike = float(row['strike']) if pd.notna(row.get('strike')) else 0
            bid = float(row['bid']) if pd.notna(row.get('bid')) else 0
            ask = float(row['ask']) if pd.notna(row.get('ask')) else 0
            last = float(row['lastPrice']) if pd.notna(row.get('lastPrice')) else 0
            volume = int(row['volume']) if pd.notna(row.get('volume')) else 0
            open_interest = int(row['openInterest']) if pd.notna(row.get('openInterest')) else 0
            iv = float(row['impliedVolatility']) if pd.notna(row.get('impliedVolatility')) else 0
            change = float(row['change']) if pd.notna(row.get('change')) else 0
            percent_change = float(row['percentChange']) if pd.notna(row.get('percentChange')) else 0
            
            # Auto-create contract in database
            contract_obj, created = OptionContract.objects.get_or_create(
                contract_symbol=contract_symbol,
                defaults={
                    'underlying_symbol': symbol,
                    'option_type': 'put',
                    'strike_price': strike,
                    'expiration_date': selected_expiration,
                    'multiplier': 100,
                }
            )
            
            contracts.append({
                'contract_symbol': contract_symbol,
                'underlying_symbol': symbol,
                'option_type': 'put',
                'strike': strike,
                'expiration': selected_expiration,
                'bid': bid,
                'ask': ask,
                'last': last,
                'mark': round((bid + ask) / 2, 2) if bid and ask else last,
                'volume': volume,
                'open_interest': open_interest,
                'implied_volatility': round(iv * 100, 2),
                'in_the_money': row.get('inTheMoney', False),
                'change': round(change, 2),
                'percent_change': round(percent_change, 2),
                'created': created,
            })
        
        # Sort contracts: calls first, then puts, both sorted by strike
        calls = sorted([c for c in contracts if c['option_type'] == 'call'], key=lambda x: x['strike'])
        puts = sorted([c for c in contracts if c['option_type'] == 'put'], key=lambda x: x['strike'])
        
        return cors_response({
            'symbol': symbol,
            'expirations': list(expirations),
            'selected_expiration': selected_expiration,
            'calls': calls,
            'puts': puts,
            'total_contracts': len(contracts),
            'contracts_created': sum(1 for c in contracts if c.get('created', False)),
        })
        
    except Exception as e:
        return cors_response({'error': str(e)}, status=500)


# ============================================
# OPTION CONTRACT DETAIL - FETCH SINGLE CONTRACT
# ============================================

@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def option_contract_detail_view(request):
    """
    Fetch detailed data for a single option contract from Yahoo Finance.
    
    GET /api/paper-trading/options/contract/?symbol=AAPL250221C00200000
    
    Returns bid/ask/volume/greeks and underlying price for a specific contract.
    """
    if request.method == "OPTIONS":
        return options_response()
    
    contract_symbol = request.GET.get('symbol', '')
    if not contract_symbol:
        return cors_response({'error': 'Contract symbol parameter required'}, status=400)
    
    try:
        import yfinance as yf
        import pandas as pd
        import re
        
        # Parse the OCC contract symbol to extract details
        # Format: AAPL250221C00200000 = AAPL Feb 21 2025 $200 Call
        # Underlying (1-6 chars) + Date (6 digits YYMMDD) + Type (C/P) + Strike (8 digits, strike*1000)
        match = re.match(r'^([A-Z]{1,6})(\d{6})([CP])(\d{8})$', contract_symbol)
        
        if not match:
            return cors_response({
                'error': f'Invalid contract symbol format: {contract_symbol}',
                'expected_format': 'AAPL250221C00200000'
            }, status=400)
        
        underlying_symbol = match.group(1)
        date_str = match.group(2)  # YYMMDD
        option_type_char = match.group(3)  # C or P
        strike_raw = match.group(4)  # 8 digits
        
        # Parse date
        year = int('20' + date_str[:2])
        month = int(date_str[2:4])
        day = int(date_str[4:6])
        expiration_date = f'{year}-{month:02d}-{day:02d}'
        
        # Parse strike (divide by 1000)
        strike = int(strike_raw) / 1000
        
        # Parse type
        option_type = 'call' if option_type_char == 'C' else 'put'
        
        # Get underlying ticker for current price
        underlying_ticker = yf.Ticker(underlying_symbol)
        underlying_info = underlying_ticker.info
        underlying_price = underlying_info.get('regularMarketPrice') or underlying_info.get('currentPrice') or 0
        
        # Fetch the options chain for this expiration
        try:
            expirations = underlying_ticker.options
            if expiration_date not in expirations:
                # Find closest expiration
                closest_exp = min(expirations, key=lambda x: abs((pd.to_datetime(x) - pd.to_datetime(expiration_date)).days)) if expirations else None
                if closest_exp:
                    expiration_date = closest_exp
                else:
                    return cors_response({
                        'error': f'No options available for {underlying_symbol}',
                        'contract_symbol': contract_symbol,
                    }, status=404)
            
            opt_chain = underlying_ticker.option_chain(expiration_date)
            chain_df = opt_chain.calls if option_type == 'call' else opt_chain.puts
        except Exception as e:
            return cors_response({
                'error': f'Failed to fetch options chain: {str(e)}',
                'contract_symbol': contract_symbol,
            }, status=500)
        
        # Find the specific contract
        contract_row = chain_df[chain_df['contractSymbol'] == contract_symbol]
        
        if contract_row.empty:
            # Try to find by strike
            contract_row = chain_df[chain_df['strike'] == strike]
        
        if contract_row.empty:
            return cors_response({
                'error': f'Contract not found: {contract_symbol}',
                'underlying': underlying_symbol,
                'strike': strike,
                'expiration': expiration_date,
                'type': option_type,
            }, status=404)
        
        row = contract_row.iloc[0]
        
        # Extract data
        bid = float(row['bid']) if pd.notna(row.get('bid')) else 0
        ask = float(row['ask']) if pd.notna(row.get('ask')) else 0
        last = float(row['lastPrice']) if pd.notna(row.get('lastPrice')) else 0
        volume = int(row['volume']) if pd.notna(row.get('volume')) else 0
        open_interest = int(row['openInterest']) if pd.notna(row.get('openInterest')) else 0
        iv = float(row['impliedVolatility']) if pd.notna(row.get('impliedVolatility')) else 0
        in_the_money = row.get('inTheMoney', False)
        
        # Calculate mark price
        mark = round((bid + ask) / 2, 2) if bid and ask else last
        
        # Determine if ITM
        if option_type == 'call':
            in_the_money = underlying_price > strike
        else:
            in_the_money = underlying_price < strike
        
        return cors_response({
            'contract_symbol': contract_symbol,
            'underlying_symbol': underlying_symbol,
            'underlying_price': round(underlying_price, 2),
            'option_type': option_type,
            'strike': strike,
            'expiration': expiration_date,
            'bid': bid,
            'ask': ask,
            'last': last,
            'mark': mark,
            'volume': volume,
            'open_interest': open_interest,
            'implied_volatility': round(iv * 100, 2),
            'in_the_money': in_the_money,
            # Greeks are not directly available from yfinance basic API
            # Would need additional calculation or a different data source
        })
        
    except Exception as e:
        import traceback
        return cors_response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500)
