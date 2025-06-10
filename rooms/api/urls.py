from .views import RoomView, CreateRoom, JoinRoom
from django.urls import path

urlpatterns = [
    path('home', RoomView.as_view()),
    path('create', CreateRoom.as_view()),
    path('join', JoinRoom.as_view()),
]
