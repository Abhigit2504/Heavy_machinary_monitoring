# authapp/urls.py

from django.urls import path
from .views import RegisterView, LoginView,record_history,list_history,clear_history,delete_history_record

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('history/record/',record_history),
    path('history/list/',list_history),
    path('history/clear/', clear_history),
    path('history/delete/<int:id>/', delete_history_record), 
    
]
