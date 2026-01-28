from django.urls import path
from . import views
from .indicators import technical_indicators

urlpatterns = [
    path('', views.market_data, name='market_data'),
    path('health/', views.health_check, name='health_check'),
    path('stock-detail/', views.stock_detail, name='stock_detail'),
    path('search/', views.search_stocks, name='search_stocks'),
    path('live-screens/', views.live_screens, name='live_screens'),
    path('historical-signals/', views.historical_signals, name='historical_signals'),
    path('indicators/<str:symbol>/', technical_indicators, name='technical_indicators'),
]