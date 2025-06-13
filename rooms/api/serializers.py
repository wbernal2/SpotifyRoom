from rest_framework import serializers
from .models import Room

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('id', 'code', 'host', 'guest_can_pause', 'votes_to_skip', 'created_at')

class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('guest_can_pause', 'votes_to_skip')
        
class JoinRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('code',)

    def validate_code(self, value):
        if not Room.objects.filter(code=value).exists():
            raise serializers.ValidationError("Room with this code does not exist.")
        return value
    

