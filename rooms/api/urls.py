from .views import RoomView, CreateRoom, JoinRoom
from django.urls import path

urlpatterns = [
    path('home/', RoomView.as_view(), name='home'),
    path('create/', CreateRoom.as_view(), name='create-room'),
    path('join/', JoinRoom.as_view(), name='join-room'),
]

