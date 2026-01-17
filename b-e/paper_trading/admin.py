from django.contrib import admin
from .models import (
    PaperTradingAccount, Position, Trade, Watchlist,
    OptionContract, OptionPosition, OptionTrade, OptionStrategy
)


@admin.register(PaperTradingAccount)
class PaperTradingAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'total_value', 'total_pl', 'created_at')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'account', 'quantity', 'average_cost', 'current_price', 'unrealized_pl')
    search_fields = ('symbol', 'account__user__email')
    list_filter = ('symbol',)


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'side', 'quantity', 'price', 'total_amount', 'status', 'created_at')
    search_fields = ('symbol', 'account__user__email')
    list_filter = ('side', 'status', 'order_type')
    readonly_fields = ('created_at',)


@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'account', 'target_buy_price', 'target_sell_price', 'added_at')
    search_fields = ('symbol', 'account__user__email')


# ============================================
# OPTIONS TRADING ADMIN
# ============================================

@admin.register(OptionContract)
class OptionContractAdmin(admin.ModelAdmin):
    list_display = ('contract_symbol', 'underlying_symbol', 'option_type', 'strike_price', 'expiration_date', 'is_expired')
    search_fields = ('contract_symbol', 'underlying_symbol')
    list_filter = ('option_type', 'underlying_symbol', 'expiration_date')
    ordering = ('underlying_symbol', 'expiration_date', 'strike_price')


@admin.register(OptionPosition)
class OptionPositionAdmin(admin.ModelAdmin):
    list_display = ('contract', 'account', 'position_type', 'quantity', 'average_cost', 'current_price', 'unrealized_pl')
    search_fields = ('contract__contract_symbol', 'contract__underlying_symbol', 'account__user__email')
    list_filter = ('position_type', 'contract__option_type', 'contract__underlying_symbol')
    raw_id_fields = ('contract', 'account')


@admin.register(OptionTrade)
class OptionTradeAdmin(admin.ModelAdmin):
    list_display = ('contract', 'action', 'quantity', 'premium', 'total_amount', 'status', 'created_at')
    search_fields = ('contract__contract_symbol', 'contract__underlying_symbol', 'account__user__email')
    list_filter = ('action', 'status', 'order_type', 'contract__option_type')
    readonly_fields = ('created_at',)
    raw_id_fields = ('contract', 'account')


@admin.register(OptionStrategy)
class OptionStrategyAdmin(admin.ModelAdmin):
    list_display = ('name', 'strategy_type', 'underlying_symbol', 'account', 'is_open', 'opened_at')
    search_fields = ('name', 'underlying_symbol', 'account__user__email')
    list_filter = ('strategy_type', 'underlying_symbol')
    filter_horizontal = ('legs',)
    raw_id_fields = ('account',)
