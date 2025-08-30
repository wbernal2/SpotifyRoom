from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from requests import Request, post, put, get
from .credentials import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPE_STRING
from .models import SpotifyToken, Vote
from api.models import Room
from .utils import (
    update_or_create_user_tokens, 
    is_spotify_authenticated, 
    execute_spotify_api_request
)
from django.shortcuts import redirect

def spotify_login_redirect(request):
    scopes = SCOPE_STRING
    url = Request('GET', 'https://accounts.spotify.com/authorize', params={
        'scope': scopes,
        'response_type': 'code',
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'show_dialog': 'true'
    }).prepare().url
    return redirect(url)



class AuthURL(APIView):
    def get(self, request, format=None):
        scopes = SCOPE_STRING
        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url
        
        return Response({"url": url}, status=status.HTTP_200_OK)


class SpotifyCallback(APIView):
    def post(self, request, format=None):
        code = request.data.get('code')
        error = request.data.get('error')

        response = post('https://accounts.spotify.com/api/token', data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        }).json()

        access_token = response.get('access_token')
        token_type = response.get('token_type')
        refresh_token = response.get('refresh_token')
        expires_in = response.get('expires_in')
        error = response.get('error')

        if not request.session.exists(request.session.session_key):
            request.session.create()

        update_or_create_user_tokens(
            request.session.session_key, access_token, token_type, expires_in, refresh_token)

        return Response({"message": "Success"}, status=status.HTTP_200_OK)


class IsAuthenticated(APIView):
    def get(self, request, format=None):
        is_authenticated = is_spotify_authenticated(
            self.request.session.session_key)
        return Response({"status": is_authenticated}, status=status.HTTP_200_OK)


class CurrentSong(APIView):
    def get(self, request, format=None):
        room_code = request.GET.get('room_code')
        room = Room.objects.filter(code=room_code)
        if room.exists():
            room = room[0]
        else:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
        
        host = room.host
        endpoint = "player/currently-playing"
        response = execute_spotify_api_request(host, endpoint)

        if 'error' in response or 'item' not in response:
            return Response({"error": "No song currently playing"}, status=status.HTTP_204_NO_CONTENT)

        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')

        artist_string = ""
        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ", "
            name = artist.get('name')
            artist_string += name

        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': 0,
            'id': song_id
        }

        return Response(song, status=status.HTTP_200_OK)


class PauseSong(APIView):
    def put(self, request, format=None):
        room_code = request.data.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            pause_song(room.host)
            return Response({"message": "Song paused"}, status=status.HTTP_200_OK)
        
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)


class PlaySong(APIView):
    def put(self, request, format=None):
        room_code = request.data.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_song(room.host)
            return Response({"message": "Song resumed"}, status=status.HTTP_200_OK)
        
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)


class SkipSong(APIView):
    def post(self, request, format=None):
        room_code = request.data.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        votes = Vote.objects.filter(room=room, song_id=room.current_song)
        votes_needed = room.votes_to_skip

        if self.request.session.session_key == room.host or len(votes) + 1 >= votes_needed:
            votes.delete()
            skip_song(room.host)
            return Response({"message": "Song skipped"}, status=status.HTTP_200_OK)
        else:
            vote = Vote(user=self.request.session.session_key,
                        room=room, song_id=room.current_song)
            vote.save()
            return Response({"message": "Vote registered"}, status=status.HTTP_200_OK)


def pause_song(session_id):
    return execute_spotify_api_request(session_id, "player/pause", put_=True)


def play_song(session_id):
    return execute_spotify_api_request(session_id, "player/play", put_=True)


def skip_song(session_id):
    return execute_spotify_api_request(session_id, "player/next", post_=True)
