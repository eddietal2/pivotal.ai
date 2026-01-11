from django.urls import path
from . import views

urlpatterns = [
    path('', views.market_data, name='market_data'),
    path('stock-detail/', views.stock_detail, name='stock_detail'),
]