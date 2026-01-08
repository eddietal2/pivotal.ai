from django.urls import path
from . import views

urlpatterns = [
    path('', views.market_data, name='market_data'),
]