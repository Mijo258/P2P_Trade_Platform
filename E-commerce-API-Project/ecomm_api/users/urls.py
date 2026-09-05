from django.urls import path
from .views import UserCreate, UserProfileView

urlpatterns = [
    path('register/', UserCreate.as_view(), name='register'),
     path('profile/', UserProfileView.as_view(), name='profile'),
]