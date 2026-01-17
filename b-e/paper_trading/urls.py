from django.urls import path
from . import views

urlpatterns = [
    # Stock Trading
    path('account/', views.account_view, name='paper_account'),
    path('positions/', views.positions_view, name='paper_positions'),
    path('positions/update-prices/', views.update_positions_prices, name='update_positions_prices'),
    path('trades/', views.trades_view, name='paper_trades'),
    path('summary/', views.portfolio_summary, name='portfolio_summary'),
    
    # Options Trading
    path('options/contracts/', views.option_contracts_view, name='option_contracts'),
    path('options/positions/', views.option_positions_view, name='option_positions'),
    path('options/positions/update-prices/', views.update_option_positions_prices, name='update_option_positions_prices'),
    path('options/trades/', views.option_trades_view, name='option_trades'),
    path('options/summary/', views.options_summary_view, name='options_summary'),
]
