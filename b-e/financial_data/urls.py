from django.urls import path
from . import views

urlpatterns = [
    path('data/', views.get_financial_data, name='get_financial_data'),
]