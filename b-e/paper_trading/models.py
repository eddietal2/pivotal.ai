from django.db import models
from authentication.models import User
from decimal import Decimal
from datetime import date


class PaperTradingAccount(models.Model):
    """
    A paper trading account for a user.
    Each user can have one paper trading account.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='paper_account')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('100000.00'))  # Starting balance: $100,000
    initial_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('100000.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def total_value(self):
        """Calculate total account value (balance + positions market value + options market value)"""
        positions_value = sum(p.market_value for p in self.positions.all())
        options_value = sum(p.market_value for p in self.option_positions.all())
        return self.balance + positions_value + options_value
    
    @property
    def stock_positions_value(self):
        """Total value of stock positions"""
        return sum(p.market_value for p in self.positions.all())
    
    @property
    def options_positions_value(self):
        """Total value of options positions"""
        return sum(p.market_value for p in self.option_positions.all())
    
    @property
    def total_pl(self):
        """Total profit/loss since account creation"""
        return self.total_value - self.initial_balance
    
    @property
    def total_pl_percent(self):
        """Total profit/loss percentage"""
        if self.initial_balance == 0:
            return Decimal('0')
        return (self.total_pl / self.initial_balance) * 100
    
    def __str__(self):
        return f"Paper Account for {self.user.email} - Balance: ${self.balance}"


class Position(models.Model):
    """
    A stock position in a paper trading account.
    """
    account = models.ForeignKey(PaperTradingAccount, on_delete=models.CASCADE, related_name='positions')
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=255, blank=True)
    quantity = models.DecimalField(max_digits=15, decimal_places=6)  # Support fractional shares
    average_cost = models.DecimalField(max_digits=15, decimal_places=4)  # Average cost per share
    current_price = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0'))
    opened_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('account', 'symbol')
    
    @property
    def market_value(self):
        """Current market value of the position"""
        return self.quantity * self.current_price
    
    @property
    def cost_basis(self):
        """Total cost of the position"""
        return self.quantity * self.average_cost
    
    @property
    def unrealized_pl(self):
        """Unrealized profit/loss"""
        return self.market_value - self.cost_basis
    
    @property
    def unrealized_pl_percent(self):
        """Unrealized profit/loss percentage"""
        if self.cost_basis == 0:
            return Decimal('0')
        return (self.unrealized_pl / self.cost_basis) * 100
    
    def __str__(self):
        return f"{self.symbol} x {self.quantity} @ ${self.average_cost}"


class Trade(models.Model):
    """
    A trade record (buy/sell) in a paper trading account.
    """
    SIDE_CHOICES = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('filled', 'Filled'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ]
    
    ORDER_TYPE_CHOICES = [
        ('market', 'Market'),
        ('limit', 'Limit'),
    ]
    
    account = models.ForeignKey(PaperTradingAccount, on_delete=models.CASCADE, related_name='trades')
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=255, blank=True)
    side = models.CharField(max_length=4, choices=SIDE_CHOICES)
    order_type = models.CharField(max_length=10, choices=ORDER_TYPE_CHOICES, default='market')
    quantity = models.DecimalField(max_digits=15, decimal_places=6)
    price = models.DecimalField(max_digits=15, decimal_places=4)  # Execution price
    limit_price = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)  # For limit orders
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)  # quantity * price
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='filled')
    created_at = models.DateTimeField(auto_now_add=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.side.upper()} {self.quantity} {self.symbol} @ ${self.price}"


class Watchlist(models.Model):
    """
    A watchlist item for paper trading - linked to user's existing watchlist.
    """
    account = models.ForeignKey(PaperTradingAccount, on_delete=models.CASCADE, related_name='watchlist')
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=255, blank=True)
    target_buy_price = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    target_sell_price = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    notes = models.TextField(blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('account', 'symbol')
    
    def __str__(self):
        return f"{self.symbol} on {self.account.user.email}'s watchlist"


# ============================================
# OPTIONS TRADING MODELS
# ============================================

class OptionContract(models.Model):
    """
    Represents an options contract specification.
    This is a reference model for option details.
    """
    OPTION_TYPE_CHOICES = [
        ('call', 'Call'),
        ('put', 'Put'),
    ]
    
    underlying_symbol = models.CharField(max_length=20, help_text="The underlying stock symbol (e.g., AAPL)")
    option_type = models.CharField(max_length=4, choices=OPTION_TYPE_CHOICES)
    strike_price = models.DecimalField(max_digits=15, decimal_places=2)
    expiration_date = models.DateField()
    contract_symbol = models.CharField(max_length=50, unique=True, help_text="OCC option symbol (e.g., AAPL240119C00150000)")
    multiplier = models.IntegerField(default=100, help_text="Contract multiplier (typically 100 shares)")
    
    class Meta:
        unique_together = ('underlying_symbol', 'option_type', 'strike_price', 'expiration_date')
        ordering = ['underlying_symbol', 'expiration_date', 'strike_price']
    
    @property
    def is_expired(self):
        """Check if the option has expired"""
        return date.today() > self.expiration_date
    
    @property
    def days_to_expiration(self):
        """Days until expiration"""
        delta = self.expiration_date - date.today()
        return max(0, delta.days)
    
    def __str__(self):
        return f"{self.underlying_symbol} {self.expiration_date} ${self.strike_price} {self.option_type.upper()}"


class OptionPosition(models.Model):
    """
    An options position in a paper trading account.
    """
    POSITION_TYPE_CHOICES = [
        ('long', 'Long'),   # Bought options (paid premium)
        ('short', 'Short'), # Sold/written options (received premium)
    ]
    
    account = models.ForeignKey(PaperTradingAccount, on_delete=models.CASCADE, related_name='option_positions')
    contract = models.ForeignKey(OptionContract, on_delete=models.PROTECT, related_name='positions')
    position_type = models.CharField(max_length=5, choices=POSITION_TYPE_CHOICES)
    quantity = models.IntegerField(help_text="Number of contracts")
    average_cost = models.DecimalField(max_digits=15, decimal_places=4, help_text="Average premium paid/received per contract")
    current_price = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0'), help_text="Current option premium")
    opened_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('account', 'contract', 'position_type')
    
    @property
    def market_value(self):
        """Current market value of the position"""
        value = self.quantity * self.current_price * self.contract.multiplier
        # Short positions have negative market value (liability)
        return value if self.position_type == 'long' else -value
    
    @property
    def cost_basis(self):
        """Total cost/credit of the position"""
        basis = self.quantity * self.average_cost * self.contract.multiplier
        return basis if self.position_type == 'long' else -basis
    
    @property
    def unrealized_pl(self):
        """Unrealized profit/loss"""
        if self.position_type == 'long':
            # Long: profit when price goes up
            return self.market_value - self.cost_basis
        else:
            # Short: profit when price goes down (received premium - current liability)
            return -self.cost_basis - self.market_value
    
    @property
    def unrealized_pl_percent(self):
        """Unrealized profit/loss percentage"""
        if self.cost_basis == 0:
            return Decimal('0')
        return (self.unrealized_pl / abs(self.cost_basis)) * 100
    
    @property
    def is_itm(self):
        """Check if option is in-the-money (requires underlying price)"""
        # This would need underlying price to calculate properly
        return None
    
    def __str__(self):
        direction = "Long" if self.position_type == 'long' else "Short"
        return f"{direction} {self.quantity}x {self.contract}"


class OptionTrade(models.Model):
    """
    An options trade record in a paper trading account.
    """
    ACTION_CHOICES = [
        ('buy_to_open', 'Buy to Open'),      # Open a long position
        ('sell_to_close', 'Sell to Close'),  # Close a long position
        ('sell_to_open', 'Sell to Open'),    # Open a short position (write)
        ('buy_to_close', 'Buy to Close'),    # Close a short position
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('filled', 'Filled'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
        ('assigned', 'Assigned'),   # Short option was assigned
        ('exercised', 'Exercised'), # Long option was exercised
    ]
    
    ORDER_TYPE_CHOICES = [
        ('market', 'Market'),
        ('limit', 'Limit'),
    ]
    
    account = models.ForeignKey(PaperTradingAccount, on_delete=models.CASCADE, related_name='option_trades')
    contract = models.ForeignKey(OptionContract, on_delete=models.PROTECT, related_name='trades')
    action = models.CharField(max_length=15, choices=ACTION_CHOICES)
    order_type = models.CharField(max_length=10, choices=ORDER_TYPE_CHOICES, default='market')
    quantity = models.IntegerField(help_text="Number of contracts")
    premium = models.DecimalField(max_digits=15, decimal_places=4, help_text="Premium per share (not per contract)")
    limit_price = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, help_text="Total premium (quantity * premium * multiplier)")
    commission = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), help_text="Commission/fees")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='filled')
    created_at = models.DateTimeField(auto_now_add=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # For assignment/exercise tracking
    assigned_shares = models.IntegerField(null=True, blank=True, help_text="Number of shares assigned/exercised")
    assignment_price = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    @property
    def is_opening(self):
        """Check if this trade opens a position"""
        return self.action in ['buy_to_open', 'sell_to_open']
    
    @property
    def is_closing(self):
        """Check if this trade closes a position"""
        return self.action in ['sell_to_close', 'buy_to_close']
    
    def __str__(self):
        return f"{self.get_action_display()} {self.quantity}x {self.contract} @ ${self.premium}"


class OptionStrategy(models.Model):
    """
    Tracks multi-leg option strategies (spreads, straddles, etc.)
    """
    STRATEGY_TYPE_CHOICES = [
        # Single-leg strategies
        ('long_call', 'Long Call'),
        ('long_put', 'Long Put'),
        ('short_call', 'Short Call (Naked)'),
        ('short_put', 'Short Put (Cash-Secured)'),
        # Multi-leg spreads
        ('vertical_call', 'Vertical Call Spread'),
        ('vertical_put', 'Vertical Put Spread'),
        ('iron_condor', 'Iron Condor'),
        ('iron_butterfly', 'Iron Butterfly'),
        ('straddle', 'Straddle'),
        ('strangle', 'Strangle'),
        ('covered_call', 'Covered Call'),
        ('protective_put', 'Protective Put'),
        ('collar', 'Collar'),
        ('calendar', 'Calendar Spread'),
        ('diagonal', 'Diagonal Spread'),
        ('custom', 'Custom Strategy'),
    ]
    
    account = models.ForeignKey(PaperTradingAccount, on_delete=models.CASCADE, related_name='option_strategies')
    name = models.CharField(max_length=100)
    strategy_type = models.CharField(max_length=20, choices=STRATEGY_TYPE_CHOICES)
    underlying_symbol = models.CharField(max_length=20)
    legs = models.ManyToManyField(OptionPosition, related_name='strategies')
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    @property
    def is_open(self):
        """Check if strategy is still open"""
        return self.closed_at is None
    
    @property
    def total_value(self):
        """Total market value of all legs"""
        return sum(leg.market_value for leg in self.legs.all())
    
    @property
    def total_cost(self):
        """Total cost basis of all legs"""
        return sum(leg.cost_basis for leg in self.legs.all())
    
    @property
    def total_pl(self):
        """Total P&L of the strategy"""
        return self.total_value - self.total_cost
    
    def __str__(self):
        return f"{self.name} ({self.get_strategy_type_display()}) on {self.underlying_symbol}"
