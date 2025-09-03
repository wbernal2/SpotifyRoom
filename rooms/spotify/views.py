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
    room_code = request.GET.get('room_code')
    scopes = SCOPE_STRING
    
    # Include room_code as state parameter
    params = {
        'scope': scopes,
        'response_type': 'code',
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'show_dialog': 'true'
    }
    
    # Add state parameter with room_code if present
    if room_code:
        params['state'] = room_code
        
    url = Request('GET', 'https://accounts.spotify.com/authorize', params=params).prepare().url
    
    # Direct redirect to Spotify authorization page
    return redirect(url)



class AuthURL(APIView):
    def get(self, request, format=None):
        room_code = request.GET.get('room_code')
        scopes = SCOPE_STRING
        
        params = {
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
        }
        
        # Add state parameter with room_code if present
        if room_code:
            params['state'] = room_code
            
        url = Request('GET', 'https://accounts.spotify.com/authorize', params=params).prepare().url
        
        return Response({"url": url}, status=status.HTTP_200_OK)


class SpotifyCallback(APIView):
    def get(self, request, format=None):
        print("Debug - SpotifyCallback GET:", request.GET, request.path)
        code = request.GET.get('code')
        error = request.GET.get('error')
        state = request.GET.get('state')  # This will have our room_code
        
        print(f"Code: {code}, Error: {error}, State (Room Code): {state}")

        if error:
            print(f"Error from Spotify: {error}")
            return redirect('/')
            
        if not code:
            print("No code received from Spotify")
            return redirect('/')

        print(f"Sending token request to Spotify with code: {code}")
        response = post('https://accounts.spotify.com/api/token', data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        }).json()

        print("Token response:", response)
        
        access_token = response.get('access_token')
        token_type = response.get('token_type')
        refresh_token = response.get('refresh_token')
        expires_in = response.get('expires_in')
        error = response.get('error')
        
        if error:
            print(f"Error in token response: {error}")
            return redirect('/')
            
        if not access_token:
            print("No access token received")
            return redirect('/')
            
        print(f"Received access token: {access_token[:10]}... (truncated)")

        if not request.session.exists(request.session.session_key):
            print("Creating new session")
            request.session.create()
            
        session_key = request.session.session_key
        print(f"Session key: {session_key}")

        update_or_create_user_tokens(
            session_key, access_token, token_type, expires_in, refresh_token)
        print("Tokens saved to database")

        # Redirect to the room if state (room_code) is provided, otherwise to home
        redirect_url = '/'
        if state:
            # Include a script that will store the room code in sessionStorage before redirecting
            # This ensures the room code is available even if the redirect doesn't work perfectly
            html_response = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecting...</title>
                <script>
                    // Store room code in session storage
                    sessionStorage.setItem("lastRoomCode", "{state}");
                    console.log("Stored room code in session: {state}");
                    
                    // Redirect after a short delay
                    setTimeout(function() {{
                        window.location.href = "/room/{state}";
                    }}, 500);
                </script>
            </head>
            <body>
                <h1 style="font-family: sans-serif; text-align: center; margin-top: 100px;">
                    Authentication successful!
                </h1>
                <p style="font-family: sans-serif; text-align: center;">
                    Redirecting to your room...
                </p>
            </body>
            </html>
            """
            print(f"Returning HTML with redirect to room: /room/{state}")
            
            from django.http import HttpResponse
            return HttpResponse(html_response)
        else:
            print("No state/room_code provided, redirecting to home")
            return redirect('/')
    
    def post(self, request, format=None):
        # For backward compatibility
        code = request.data.get('code')
        error = request.data.get('error')
        state = request.data.get('state')  # This will have our room_code

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

        return Response({"message": "Success", "room_code": state}, status=status.HTTP_200_OK)


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
        
        # Check if host is authenticated with Spotify
        if not is_spotify_authenticated(host):
            return Response(
                {"error": "Spotify authentication required"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        # Try to refresh token if needed before making the API request
        endpoint = "player/currently-playing"
        response = execute_spotify_api_request(host, endpoint)

        if 'error' in response:
            if response.get('error', {}).get('status') == 401:
                # Try refreshing token once more if we got an auth error
                refresh_spotify_token(host)
                response = execute_spotify_api_request(host, endpoint)
                
        if 'error' in response or 'item' not in response:
            return Response({"error": "No song currently playing"}, status=status.HTTP_204_NO_CONTENT)

        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')
        
        # Update the current song in the room
        if room.current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])

        artist_string = ""
        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ", "
            name = artist.get('name')
            artist_string += name

        votes = len(Vote.objects.filter(room=room, song_id=song_id))
        
        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': votes,
            'votes_needed': room.votes_to_skip,
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
