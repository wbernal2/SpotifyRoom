"""
WebSocket consumers for room chat functionality.
"""

import json
import time
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class RoomChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Parse room_code from URL route kwargs
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.group_name = f"room_{self.room_code}"

        # Join room group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Accept the connection
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        """
        Handle incoming JSON messages from WebSocket client.
        Expected format: { "type": "chat.message", "name": "...", "text": "..." }
        """
        try:
            # Validate message type
            if content.get("type") != "chat.message":
                await self.send_json({
                    "type": "chat.error",
                    "message": "Invalid message type. Expected 'chat.message'."
                })
                return

            # Extract and validate name
            name = content.get("name", "").strip()
            if not name or len(name) < 1 or len(name) > 24:
                await self.send_json({
                    "type": "chat.error",
                    "message": "Name must be between 1 and 24 characters."
                })
                return

            # Extract and validate text
            text = content.get("text", "").strip()
            if not text or len(text) < 1 or len(text) > 500:
                await self.send_json({
                    "type": "chat.error",
                    "message": "Message text must be between 1 and 500 characters."
                })
                return

            # Get current timestamp in milliseconds
            ts = int(time.time() * 1000)

            # Broadcast to the room group
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.broadcast",
                    "name": name,
                    "text": text,
                    "ts": ts
                }
            )

        except (KeyError, TypeError, ValueError) as e:
            # Handle malformed JSON or missing required fields
            await self.send_json({
                "type": "chat.error",
                "message": "Invalid message format."
            })

    async def chat_broadcast(self, event):
        """
        Handle chat.broadcast events sent to the group.
        Sends the message to the WebSocket client.
        """
        name = event["name"]
        text = event["text"]
        ts = event["ts"]

        # Send message to WebSocket client
        await self.send_json({
            "type": "chat.message",
            "name": name,
            "text": text,
            "ts": ts
        })
