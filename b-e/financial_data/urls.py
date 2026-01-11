from django.urls import path
from . import views

urlpatterns = [
    path('', views.market_data, name='market_data'),
    path('stock-detail/', views.stock_detail, name='stock_detail'),
    path('search/', views.search_stocks, name='search_stocks'),
]