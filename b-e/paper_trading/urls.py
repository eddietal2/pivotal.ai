from django.urls import path
from . import views

urlpatterns = [
    # Stock Trading
    path('account/', views.account_view, name='paper_account'),
    path('account/reset/', views.reset_account_view, name='paper_account_reset'),
    path('positions/', views.positions_view, name='paper_positions'),
    path('positions/update-prices/', views.update_positions_prices, name='update_positions_prices'),
    path('trades/', views.trades_view, name='paper_trades'),
    path('summary/', views.portfolio_summary, name='portfolio_summary'),
    
    # Options Trading
    path('options/chain/', views.options_chain_view, name='options_chain'),  # Fetch real options data
    path('options/contract/', views.option_contract_detail_view, name='option_contract_detail'),  # Single contract detail
    path('options/contracts/', views.option_contracts_view, name='option_contracts'),
    path('options/positions/', views.option_positions_view, name='option_positions'),
    path('options/positions/update-prices/', views.update_option_positions_prices, name='update_option_positions_prices'),
    path('options/close-expired/', views.close_expired_position, name='close_expired_position'),
    path('options/trades/', views.option_trades_view, name='option_trades'),
    path('options/summary/', views.options_summary_view, name='options_summary'),
]
