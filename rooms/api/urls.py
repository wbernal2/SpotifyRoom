from .views import RoomView, CreateRoomView, JoinRoomView, GetRoomView
from django.urls import path

urlpatterns = [
    path('home/', RoomView.as_view(), name='home'),
    path('create/', CreateRoomView.as_view(), name='create-room'),
    path('join/', JoinRoomView.as_view(), name='join-room'),
    path('room/<str:room_code>/', RoomView.as_view(), name='room-detail'),
    path('get-room', GetRoomView.as_view(), name='get-room')

]

