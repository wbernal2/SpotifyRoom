from django.urls import path
from . import views

app_name = "spotify"

urlpatterns = [
    path('login/', views.spotify_login_redirect, name='login'),
    path('get-auth-url/', views.AuthURL.as_view(), name='get-auth-url'),
    path('callback/', views.SpotifyCallback.as_view(), name='callback'),
    path('redirect/', views.SpotifyCallback.as_view(), name='redirect'),
    path('is-authenticated/', views.IsAuthenticated.as_view(), name='is-authenticated'),
    path('current-song/', views.CurrentSong.as_view(), name='current-song'),
    path('pause/', views.PauseSong.as_view(), name='pause'),
    path('play/', views.PlaySong.as_view(), name='play'),
    path('skip/', views.SkipSong.as_view(), name='skip'),
    path('debug/', views.spotify_debug_view, name='debug'),
    path('test-player/', views.TestPlayerView.as_view(), name='test-player'),
    path('api-debug/', views.api_debug_view, name='api-debug'),
    path('verify-room/', views.verify_room_exists, name='verify-room'),
    path('setup/', views.spotify_credentials_setup, name='setup'),
    path('test-auth/', views.spotify_test_auth_view, name='test-auth'),
    path('create-test-token/', views.create_test_token, name='create-test-token'),
    path('clear-tokens/', views.clear_all_tokens, name='clear-tokens'),
]
