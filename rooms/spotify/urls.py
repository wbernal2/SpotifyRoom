from django.urls import path
from . import views

app_name = "spotify"

urlpatterns = [
    path('login/', views.spotify_login_redirect, name='login'),
    path('callback/', views.SpotifyCallback.as_view(), name='callback'),
    path('redirect/', views.SpotifyCallback.as_view(), name='redirect'),
]
