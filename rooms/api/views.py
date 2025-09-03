from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Room
from .serializers import RoomSerializer, CreateRoomSerializer, JoinRoomSerializer,UpdateRoomSerializer


class RoomView(generics.CreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class CreateRoomView(generics.CreateAPIView):
    queryset = Room.objects.all()
    serializer_class = CreateRoomSerializer

    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            host = self.request.session.session_key

            queryset = Room.objects.filter(host=host)
            if queryset.exists():
                room = queryset[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
            else:
                room = Room(host=host, guest_can_pause=guest_can_pause, votes_to_skip=votes_to_skip)
                room.save()
                return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JoinRoomView(generics.CreateAPIView):
    queryset = Room.objects.all()
    serializer_class = JoinRoomSerializer
    
    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
            
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            code = serializer.data.get('code')
            room = Room.objects.filter(code=code).first()
            
            if room:
                # Store room code in session and return success
                self.request.session['room_code'] = code
                return Response({"message": "Room Joined!", "code": code}, status=status.HTTP_200_OK)
            
            return Response({"error": "Room not found."}, status=status.HTTP_404_NOT_FOUND)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetRoomView(APIView):  # ✅ FIXED: using APIView instead of CreateAPIView
    def get(self, request, format=None):
        code = request.GET.get('code')
        if code:
            room = Room.objects.filter(code=code).first()
            if room:
                # Check if current user is the host
                if not self.request.session.exists(self.request.session.session_key):
                    self.request.session.create()
                
                is_host = room.host == self.request.session.session_key
                
                return Response({
                    "code": room.code,
                    "guest_can_pause": room.guest_can_pause,
                    "votes_to_skip": room.votes_to_skip,
                    "is_host": is_host,
                }, status=status.HTTP_200_OK)
            return Response({"error": "Room not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": "Code param missing."}, status=status.HTTP_400_BAD_REQUEST)


class LeaveRoomView(APIView):
    def post(self, request, format=None):
        # Clear the room code from the user's session
        if 'room_code' in request.session:
            del request.session['room_code']
        return Response({"message": "Successfully left the room."}, status=status.HTTP_200_OK)


class UpdateRoomView(APIView):
    def patch(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = UpdateRoomSerializer(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            code = serializer.data.get('code')
            
            room = Room.objects.filter(code=code).first()
            if not room:
                return Response({"error": "Room not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user is the host of the room
            if room.host != self.request.session.session_key:
                return Response({"error": "You are not the host of this room."}, status=status.HTTP_403_FORBIDDEN)
            
            # Update room settings
            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
            
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
