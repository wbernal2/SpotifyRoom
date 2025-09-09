"""
WebSocket routing for the API app.
"""

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/chat/<str:room_code>/", consumers.RoomChatConsumer.as_asgi()),
]
