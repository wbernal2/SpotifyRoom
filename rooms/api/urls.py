from .views import RoomView, CreateRoomView, JoinRoomView
from django.urls import path

urlpatterns = [
    path('home/', RoomView.as_view(), name='home'),
    path('create/', CreateRoomView.as_view(), name='create-room'),
    path('join/', JoinRoomView.as_view(), name='join-room'),
]

