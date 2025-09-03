from django.shortcuts import render
from django.views import View
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from requests import Request, post, put, get
from .credentials import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPE_STRING
import json
from .models import SpotifyToken, Vote
from api.models import Room
from .utils import (
    update_or_create_user_tokens, 
    is_spotify_authenticated,
    get_user_tokens,
    execute_spotify_api_request
)
from django.shortcuts import redirect

def spotify_login_redirect(request):
    room_code = request.GET.get('room_code')
    print(f"Spotify login redirect called with room_code: {room_code}")
    
    # Create session if not exists
    if not request.session.exists(request.session.session_key):
        request.session.create()
        print(f"Created new session in spotify_login_redirect: {request.session.session_key}")
    else:
        print(f"Using existing session: {request.session.session_key}")
    
    # Save room code in session for better persistence
    if room_code:
        request.session['spotify_room_code'] = room_code
        request.session.save()
        print(f"Saved room_code {room_code} to session")
    
    scopes = SCOPE_STRING
    print(f"Using scopes: {scopes}")
    
    # Include room_code as state parameter
    params = {
        'scope': scopes,
        'response_type': 'code',
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'show_dialog': 'true'  # Always show the authorization dialog
    }
    
    # Add state parameter with room_code if present
    if room_code:
        params['state'] = room_code
        print(f"Added room_code {room_code} as state parameter")
        
    url = Request('GET', 'https://accounts.spotify.com/authorize', params=params).prepare().url
    print(f"Redirecting to Spotify auth URL: {url[:60]}...")
    
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
        
        print(f"Code: {code[:10]}... (truncated)" if code else "Code: None")
        print(f"Error: {error}")
        print(f"State (Room Code): {state}")

        if error:
            print(f"Error from Spotify: {error}")
            return redirect('/spotify/debug/?error=' + error)
            
        if not code:
            print("No code received from Spotify")
            return redirect('/spotify/debug/?error=no_code')

        # Create session if not exists
        if not request.session.exists(request.session.session_key):
            request.session.create()
            print(f"Created new session in callback: {request.session.session_key}")
        
        # Force session save to ensure session persistence
        request.session.save()
            
        session_key = request.session.session_key
        print(f"Using session key: {session_key}")
        
        # Check session works by setting a test value
        request.session['spotify_auth_test'] = 'test_value'
        request.session.save()
        test_value = request.session.get('spotify_auth_test')
        print(f"Session test - set: 'test_value', retrieved: '{test_value}'")

        print(f"Sending token request to Spotify with code: {code[:10]}..." if code else "No code")
        print(f"REDIRECT_URI: {REDIRECT_URI}")
        print(f"CLIENT_ID: {CLIENT_ID[:5]}...")
        print(f"CLIENT_SECRET: {CLIENT_SECRET[:5]}...")
        
        token_request_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        }
        
        try:
            print("About to make token request with data:")
            for key, value in token_request_data.items():
                if key != 'client_secret':
                    print(f"  {key}: {value[:10] + '...' if isinstance(value, str) and len(value) > 10 else value}")
                else:
                    print(f"  {key}: [REDACTED]")
                
            token_response = post('https://accounts.spotify.com/api/token', data=token_request_data)
            print(f"Token response status: {token_response.status_code}")
            
            if token_response.status_code != 200:
                print(f"ERROR: Token response failed with status {token_response.status_code}")
                print(f"Error response body: {token_response.text}")
                return redirect(f'/spotify/debug/?error=token_error&status={token_response.status_code}')
                
            response = token_response.json()
            print(f"Token response keys: {list(response.keys())}")
            
            if 'error' in response:
                print(f"Spotify API error: {response['error']}")
                error_desc = response.get('error_description', 'unknown')
                return redirect(f'/spotify/debug/?error=spotify_error&desc={error_desc}')
                
            if 'access_token' not in response:
                print("No access_token in response!")
                return redirect('/spotify/debug/?error=no_token')
                
        except Exception as e:
            print(f"Exception during token request: {str(e)}")
            import traceback
            print(traceback.format_exc())
            from urllib.parse import quote
            return redirect(f'/spotify/debug/?error=exception&message={quote(str(e))}')

        print(f"Token response keys: {response.keys()}")
        
        access_token = response.get('access_token')
        token_type = response.get('token_type')
        refresh_token = response.get('refresh_token')
        expires_in = response.get('expires_in')
        error = response.get('error')
        
        if error:
            print(f"Error in token response: {error}")
            return redirect(f'/spotify/debug/?error={error}')
            
        if not access_token:
            print("No access token received")
            return redirect('/spotify/debug/?error=no_access_token')
            
        print(f"Received access token: {access_token[:10]}... (truncated)")
        print(f"Token type: {token_type}")
        print(f"Expires in: {expires_in} seconds")
        print(f"Refresh token: {refresh_token[:10]}... (truncated)" if refresh_token else "No refresh token")

        # Ensure session exists again
        if not request.session.exists(request.session.session_key):
            print("Creating new session")
            request.session.create()
            request.session.save()
            
        # Store token info in session temporarily to verify it works
        request.session['spotify_access_token_temp'] = access_token[:10] + '...'
        request.session.save()
        session_token_check = request.session.get('spotify_access_token_temp')
        print(f"Session token check - stored and retrieved: {session_token_check}")
            
        session_key = request.session.session_key
        print(f"Session key for token storage: {session_key}")

        # Save token to database
        try:
            print(f"Now attempting to save tokens to database with session key: {session_key}")
            print(f"Access token (first 10 chars): {access_token[:10] if access_token else 'None'}")
            print(f"Token type: {token_type}")
            print(f"Expires in: {expires_in} seconds")
            print(f"Refresh token present: {'Yes' if refresh_token else 'No'}")
            
            if not session_key:
                print("ERROR: No session key available!")
                return redirect('/spotify/debug/?error=no_session')
            
            if not access_token:
                print("ERROR: No access token to save!")
                return redirect('/spotify/debug/?error=no_access_token')
            
            # Store important information in session for debugging
            request.session['spotify_debug_time'] = str(import_datetime().now())
            request.session.save()
                
            # Import directly here to ensure no circular imports
            from .utils import update_or_create_user_tokens
            token_obj = update_or_create_user_tokens(
                session_key, access_token, token_type, expires_in, refresh_token)
                
            if token_obj:
                print(f"Tokens saved to database successfully: {token_obj.id}")
            else:
                print("WARNING: Token update returned None!")
            
            # Verify token was saved - extra validation step
            from .models import SpotifyToken
            verify_token = SpotifyToken.objects.filter(user=session_key).first()
            if verify_token:
                print(f"VERIFIED: Token in database for session {session_key}")
                print(f"Token ID: {verify_token.id}")
                print(f"Created: {verify_token.created_at}")
                print(f"Expires: {verify_token.expires_in}")
            else:
                print(f"CRITICAL ERROR: Token not found in database for session {session_key} after save attempt!")
                return redirect('/spotify/debug/?error=save_failed')
                
        except Exception as e:
            print(f"EXCEPTION saving tokens: {str(e)}")
            import traceback
            print(traceback.format_exc())
            from urllib.parse import quote
            return redirect(f'/spotify/debug/?error=save_exception&message={quote(str(e))}')

        # Redirect based on the state parameter
        if state == "DEBUG":
            print("DEBUG state detected, redirecting to debug page")
            return redirect('/spotify/debug/?success=true')
        elif state and state != "TEST":
            # Enhanced redirect with multiple fallback mechanisms
            html_response = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecting to Room</title>
                <meta http-equiv="refresh" content="2;url=/room/{state}">
                <script>
                    // Store room code in multiple storage mechanisms for redundancy
                    try {{
                        // Primary: sessionStorage
                        sessionStorage.setItem("lastRoomCode", "{state}");
                        console.log("Stored room code in sessionStorage: {state}");
                        
                        // Backup: localStorage
                        localStorage.setItem("spotifyRoomBackup", "{state}");
                        
                        // Set a cookie as final fallback
                        document.cookie = "roomCode={state}; path=/; max-age=3600";
                        
                        // Redirect with multiple fallbacks
                        setTimeout(function() {{
                            console.log("Attempting navigation to room: {state}");
                            window.location.href = "/room/{state}";
                        }}, 1000);
                    }} catch (e) {{
                        console.error("Error in redirect script:", e);
                        // Ultimate fallback
                        window.location.href = "/room/{state}";
                    }}
                </script>
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background-color: #1DB954;
                        color: white;
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }}
                    .container {{
                        padding: 40px;
                        background-color: rgba(0,0,0,0.1);
                        border-radius: 12px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    }}
                    h1 {{ margin-bottom: 8px; }}
                    .loader {{
                        border: 4px solid rgba(255,255,255,0.3);
                        border-top: 4px solid #ffffff;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }}
                    @keyframes spin {{
                        0% {{ transform: rotate(0deg); }}
                        100% {{ transform: rotate(360deg); }}
                    }}
                    .room-code {{
                        font-family: monospace;
                        background: rgba(255,255,255,0.2);
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-weight: bold;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Spotify Connected!</h1>
                    <p>Redirecting to your room: <span class="room-code">{state}</span></p>
                    <div class="loader"></div>
                    <p>If you're not redirected automatically, <a href="/room/{state}" style="color: white; text-decoration: underline;">click here</a></p>
                </div>
            </body>
            </html>
            """
            print(f"Returning HTML with enhanced redirect to room: /room/{state}")
            
            from django.http import HttpResponse
            return HttpResponse(html_response)
        else:
            print("No state/room_code provided, redirecting to debug page")
            return redirect('/spotify/debug/?no_state=true')
                
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
        session_key = self.request.session.session_key
        
        # Create session if not exists
        if not request.session.exists(request.session.session_key):
            request.session.create()
            session_key = request.session.session_key
            print(f"Created new session: {session_key}")
            
        print(f"IsAuthenticated check with session: {session_key}")
        is_authenticated = is_spotify_authenticated(session_key)
        print(f"Authentication result: {is_authenticated}")
        
        return Response({"status": is_authenticated}, status=status.HTTP_200_OK)


class TestPlayerView(View):
    def get(self, request):
        session_key = request.session.session_key
        
        # Create session if not exists
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
            
        # Check if authenticated
        if not is_spotify_authenticated(session_key):
            return render(request, 'spotify/test_player.html', {
                'error': 'Not authenticated with Spotify',
                'song': None,
                'song_json': None
            })
            
        # Get current song
        endpoint = "player/currently-playing"
        response = execute_spotify_api_request(session_key, endpoint)
        
        if response is None:
            return render(request, 'spotify/test_player.html', {
                'error': 'No response from Spotify API',
                'song': None,
                'song_json': None
            })
            
        if 'error' in response:
            return render(request, 'spotify/test_player.html', {
                'error': f"Spotify API error: {response['error']}",
                'song': None,
                'song_json': None
            })
            
        if 'item' not in response or response['item'] is None:
            return render(request, 'spotify/test_player.html', {
                'error': 'No song currently playing',
                'song': None,
                'song_json': None
            })
            
        # Process song data
        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        
        try:
            album_cover = item.get('album', {}).get('images', [{}])[0].get('url')
        except (IndexError, AttributeError):
            album_cover = ""
            
        is_playing = response.get('is_playing')
        song_id = item.get('id')

        artist_string = ""
        for i, artist in enumerate(item.get('artists', [])):
            if i > 0:
                artist_string += ", "
            name = artist.get('name', 'Unknown Artist')
            artist_string += name

        song = {
            'title': item.get('name', 'Unknown Song'),
            'artist': artist_string or 'Unknown Artist',
            'duration': duration or 0,
            'time': progress or 0,
            'image_url': album_cover or '',
            'is_playing': is_playing or False,
            'votes': 0,
            'votes_needed': 1,
            'id': song_id or ''
        }
        
        import json
        song_json = json.dumps(song, indent=2)
        
        return render(request, 'spotify/test_player.html', {
            'song': song,
            'song_json': song_json,
            'error': None
        })

class CurrentSong(APIView):
    def get(self, request, format=None):
        # Global try-except to catch any unexpected errors
        try:
            room_code = request.GET.get('room_code')
            print(f"Current song requested for room: {room_code}")
            
            # Always set JSON content type for consistency
            response_headers = {'Content-Type': 'application/json'}
            
            if not room_code:
                print("No room code provided")
                return Response(
                    {"error": "Room code required", "success": False}, 
                    status=status.HTTP_400_BAD_REQUEST,
                    headers=response_headers
                )
            
            # Safely get the room
            try:
                room = Room.objects.filter(code=room_code)
                if room.exists():
                    room = room[0]
                    print(f"Room found: {room.id}")
                else:
                    print(f"Room with code '{room_code}' not found")
                    return Response(
                        {"error": "Room not found", "success": False}, 
                        status=status.HTTP_404_NOT_FOUND,
                        headers=response_headers
                    )
            except Exception as e:
                print(f"Error retrieving room: {str(e)}")
                return Response(
                    {"error": f"Error retrieving room: {str(e)}", "success": False},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    headers=response_headers
                )
            
            host = room.host
            print(f"Room host: {host}")
            
            # Check if host is authenticated with Spotify
            if not is_spotify_authenticated(host):
                print(f"Host {host} is not authenticated with Spotify")
                return Response(
                    {"error": "Spotify authentication required", "success": False}, 
                    status=status.HTTP_401_UNAUTHORIZED,
                    headers=response_headers
                )
            
            print(f"Requesting current song from Spotify for host: {host}")
            
            try:
                # Try to refresh token if needed before making the API request
                endpoint = "player/currently-playing"
                print(f"Requesting Spotify endpoint: {endpoint} for host: {host}")
                response = execute_spotify_api_request(host, endpoint)
                
                if response is None:
                    print("Got None response from Spotify API")
                    return Response(
                        {"error": "No response from Spotify", "success": False}, 
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                        headers=response_headers
                    )
                
                print(f"Spotify API response type: {type(response)}")
                print(f"Spotify API response keys: {response.keys() if isinstance(response, dict) else 'Not a dict'}")
                
                if 'error' in response:
                    error_details = response.get('error', {})
                    print(f"Error in Spotify API response: {error_details}")
                    
                    if isinstance(error_details, dict) and error_details.get('status') == 401:
                        # Try refreshing token once more if we got an auth error
                        print("Trying to refresh the token due to 401 error")
                        from .utils import refresh_spotify_token
                        refresh_spotify_token(host)
                        response = execute_spotify_api_request(host, endpoint)
                        
                if 'error' in response:
                    print(f"Error persists after token refresh: {response.get('error')}")
                    return Response(
                        {"error": str(response.get('error')), "success": False}, 
                        status=status.HTTP_400_BAD_REQUEST,
                        headers=response_headers
                    )
                    
                if 'item' not in response or response['item'] is None:
                    print("No item found in response - no song currently playing")
                    return Response(
                        {"error": "No song currently playing", "success": False}, 
                        status=status.HTTP_204_NO_CONTENT,
                        headers=response_headers
                    )
                
                item = response.get('item')
                duration = item.get('duration_ms')
                progress = response.get('progress_ms')
                
                try:
                    album_cover = item.get('album', {}).get('images', [{}])[0].get('url')
                except (IndexError, AttributeError):
                    album_cover = ""
                    print("Could not extract album cover URL")
                
                is_playing = response.get('is_playing')
                song_id = item.get('id')
                
                # Update the current song in the room
                if room.current_song != song_id:
                    room.current_song = song_id
                    room.save(update_fields=['current_song'])

                artist_string = ""
                for i, artist in enumerate(item.get('artists', [])):
                    if i > 0:
                        artist_string += ", "
                    name = artist.get('name', 'Unknown Artist')
                    artist_string += name

                votes = len(Vote.objects.filter(room=room, song_id=song_id))
                
                song = {
                    'title': item.get('name', 'Unknown Song'),
                    'artist': artist_string or 'Unknown Artist',
                    'duration': duration or 0,
                    'time': progress or 0,
                    'image_url': album_cover or '',
                    'is_playing': is_playing or False,
                    'votes': votes,
                    'votes_needed': room.votes_to_skip,
                    'id': song_id or '',
                    'success': True
                }

                return Response(
                    song, 
                    status=status.HTTP_200_OK,
                    headers={'Content-Type': 'application/json'}
                )
                
            except Exception as e:
                print(f"Error processing Spotify API response: {str(e)}")
                import traceback
                print(traceback.format_exc())
                return Response(
                    {"error": f"Error processing response: {str(e)}", "success": False}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    headers={'Content-Type': 'application/json'}
                )
                
        except Exception as e:
            print(f"Unexpected error in CurrentSong view: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": f"Unexpected error: {str(e)}", "success": False}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                headers={'Content-Type': 'application/json'}
            )
            
        # Final catch-all to ensure we never return HTML error pages
        except:
            import sys
            print("Critical exception in CurrentSong view:")
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": "A critical server error occurred", "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                headers={'Content-Type': 'application/json'}
            )


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


def import_datetime():
    """Helper to import datetime for debugging"""
    from datetime import datetime
    return datetime

def verify_room_exists(request):
    """API endpoint to verify if a room exists"""
    room_code = request.GET.get('code')
    
    if not room_code:
        return JsonResponse({'error': 'Room code is required', 'exists': False})
    
    try:
        from api.models import Room
        room_exists = Room.objects.filter(code=room_code).exists()
        return JsonResponse({
            'exists': room_exists, 
            'code': room_code
        })
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'exists': False,
            'code': room_code
        })

def api_debug_view(request):
    """
    Debug view for testing the CurrentSong API endpoint directly
    """
    room_code = request.GET.get('room_code', '')
    return render(request, 'spotify/api_debug.html', {'room_code': room_code})


def spotify_debug_view(request):
    """Debug view to test Spotify authentication"""
    # Ensure session exists
    if not request.session.exists(request.session.session_key):
        request.session.create()
        request.session.save()
    
    session_key = request.session.session_key
    is_authenticated = is_spotify_authenticated(session_key)
    token = get_user_tokens(session_key)
    error = request.GET.get('error', None)
    error_desc = request.GET.get('desc', None)
    success = request.GET.get('success', None)
    no_state = request.GET.get('no_state', None)
    
    # Get test values from session if they exist
    token_temp = request.session.get('spotify_access_token_temp', None)
    debug_time = request.session.get('spotify_debug_time', None)
    
    # Try to extract more debug info
    from django.db import connection
    db_info = {
        'database': connection.settings_dict.get('NAME', 'unknown'),
        'engine': connection.settings_dict.get('ENGINE', 'unknown').split('.')[-1],
    }
    
    # Log debug information
    print(f"Debug page accessed with session: {session_key}")
    print(f"Is authenticated: {is_authenticated}")
    print(f"Token present: {'Yes' if token else 'No'}")
    print(f"Token expiry: {token.expires_in if token else 'N/A'}")
    
    if error:
        print(f"Error parameter present: {error}")
    
    # Check if token is expired
    is_expired = False
    if token:
        import datetime
        if token.expires_in < datetime.datetime.now(datetime.timezone.utc):
            is_expired = True
            print(f"Token is expired! Expired at: {token.expires_in}")
    
    # Get Spotify credentials
    from .credentials import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPE_STRING
    credentials_info = {
        'client_id': CLIENT_ID[:5] + '...' if CLIENT_ID else 'Not set',
        'client_secret': CLIENT_SECRET[:5] + '...' if CLIENT_SECRET else 'Not set',
        'redirect_uri': REDIRECT_URI,
        'scopes': SCOPE_STRING,
    }
    
    # Current API info
    api_info = None
    api_error = None
    if is_authenticated:
        try:
            api_response = execute_spotify_api_request(session_key, 'me')
            if 'error' not in api_response:
                api_info = api_response
            else:
                api_error = api_response.get('error')
        except Exception as e:
            api_error = str(e)
    
    context = {
        'is_authenticated': is_authenticated,
        'session_key': session_key,
        'token': token,
        'token_expired': is_expired,
        'error': error,
        'error_desc': error_desc,
        'success': success,
        'no_state': no_state,
        'token_temp': token_temp,
        'debug_time': debug_time,
        'db_info': db_info,
        'credentials': credentials_info,
        'api_info': api_info,
        'api_error': api_error,
    }
    
    return render(request, 'spotify/debug.html', context)


def spotify_test_auth_view(request):
    """Simple test view for authentication troubleshooting"""
    # Ensure session exists
    if not request.session.exists(request.session.session_key):
        request.session.create()
        request.session.save()
    
    session_key = request.session.session_key
    is_authenticated = is_spotify_authenticated(session_key)
    
    print(f"Auth Test Page: Session key = {session_key}")
    print(f"Auth Test Page: Is authenticated = {is_authenticated}")
    
    # Let's get all available tokens for debugging
    from .models import SpotifyToken
    all_tokens = SpotifyToken.objects.all()
    print(f"Total tokens in database: {len(all_tokens)}")
    for i, token in enumerate(all_tokens):
        print(f"Token {i+1}: user={token.user}, expires={token.expires_in}")
    
    # Check if token exists for this session
    token = None
    try:
        token = SpotifyToken.objects.filter(user=session_key).first()
        if token:
            print(f"Found token for current session: {token.id}")
        else:
            print(f"No token found for session: {session_key}")
    except Exception as e:
        print(f"Error checking token: {e}")
    
    context = {
        'session_key': session_key,
        'is_authenticated': is_authenticated,
        'token': token,
        'all_tokens': all_tokens,
    }
    
    return render(request, 'spotify/test_auth.html', context)


def create_test_token(request):
    """Create a test token for the current session"""
    if not request.session.exists(request.session.session_key):
        request.session.create()
        request.session.save()
    
    session_key = request.session.session_key
    
    try:
        from django.utils import timezone
        from datetime import timedelta
        from .models import SpotifyToken
        
        # First, check if a token already exists
        existing_token = SpotifyToken.objects.filter(user=session_key).first()
        if existing_token:
            print(f"Token already exists for session {session_key}, updating it")
            existing_token.access_token = "test_access_token"
            existing_token.refresh_token = "test_refresh_token"
            existing_token.token_type = "Bearer"
            existing_token.expires_in = timezone.now() + timedelta(hours=1)
            existing_token.save()
            print(f"Updated existing token: {existing_token.id}")
            message = "Updated existing token"
        else:
            # Create a new token for testing
            new_token = SpotifyToken.objects.create(
                user=session_key,
                access_token="test_access_token",
                refresh_token="test_refresh_token",
                token_type="Bearer",
                expires_in=timezone.now() + timedelta(hours=1)
            )
            print(f"Created new test token with ID: {new_token.id} for session: {session_key}")
            message = "Created new test token"
        
        # Verify if authentication now works
        is_auth = is_spotify_authenticated(session_key)
        print(f"Authentication status after creating token: {is_auth}")
        
        return render(request, 'spotify/test_auth.html', {
            'session_key': session_key,
            'is_authenticated': is_auth,
            'message': message,
            'success': True
        })
    except Exception as e:
        print(f"Error creating test token: {e}")
        import traceback
        print(traceback.format_exc())
        
        return render(request, 'spotify/test_auth.html', {
            'session_key': session_key,
            'is_authenticated': False,
            'error': str(e),
            'success': False
        })


def clear_all_tokens(request):
    """Clear all tokens from the database"""
    try:
        from .models import SpotifyToken
        count = SpotifyToken.objects.count()
        SpotifyToken.objects.all().delete()
        print(f"Deleted {count} tokens from database")
        message = f"Cleared {count} tokens from database"
    except Exception as e:
        print(f"Error clearing tokens: {e}")
        message = f"Error: {str(e)}"
    
    return render(request, 'spotify/test_auth.html', {
        'session_key': request.session.session_key,
        'is_authenticated': False,
        'message': message
    })


def spotify_credentials_setup(request):
    """View to update Spotify credentials"""
    # Import module level variables
    from .credentials import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPE_STRING
    
    error = None
    success = False
    
    # Current values with masked sensitive info
    current_values = {
        'client_id': CLIENT_ID,
        'client_id_masked': CLIENT_ID[:5] + '...' + CLIENT_ID[-5:] if CLIENT_ID and len(CLIENT_ID) > 10 else "Not set",
        'client_secret': CLIENT_SECRET,
        'client_secret_masked': CLIENT_SECRET[:5] + '...' + CLIENT_SECRET[-5:] if CLIENT_SECRET and len(CLIENT_SECRET) > 10 else "Not set",
        'redirect_uri': REDIRECT_URI or 'http://127.0.0.1:8000/spotify/redirect',
        'scope_string': SCOPE_STRING
    }
    
    # Handle form submission
    if request.method == 'POST':
        new_client_id = request.POST.get('client_id')
        new_client_secret = request.POST.get('client_secret')
        new_redirect_uri = request.POST.get('redirect_uri')
        new_scope_string = request.POST.get('scope_string')
        
        if new_client_id and new_client_secret and new_redirect_uri and new_scope_string:
            try:
                # Read the credentials.py file
                import os
                cred_file_path = os.path.join(os.path.dirname(__file__), 'credentials.py')
                
                with open(cred_file_path, 'r') as file:
                    content = file.read()
                
                # Replace the values
                content = content.replace(f"CLIENT_ID = '{CLIENT_ID}'", f"CLIENT_ID = '{new_client_id}'")
                content = content.replace(f"CLIENT_ID = \"{CLIENT_ID}\"", f"CLIENT_ID = \"{new_client_id}\"")
                
                content = content.replace(f"CLIENT_SECRET = '{CLIENT_SECRET}'", f"CLIENT_SECRET = '{new_client_secret}'")
                content = content.replace(f"CLIENT_SECRET = \"{CLIENT_SECRET}\"", f"CLIENT_SECRET = \"{new_client_secret}\"")
                
                content = content.replace(f"REDIRECT_URI = '{REDIRECT_URI}'", f"REDIRECT_URI = '{new_redirect_uri}'")
                content = content.replace(f"REDIRECT_URI = \"{REDIRECT_URI}\"", f"REDIRECT_URI = \"{new_redirect_uri}\"")
                
                content = content.replace(f"SCOPE_STRING = '{SCOPE_STRING}'", f"SCOPE_STRING = '{new_scope_string}'")
                content = content.replace(f"SCOPE_STRING = \"{SCOPE_STRING}\"", f"SCOPE_STRING = \"{new_scope_string}\"")
                
                # Write the updated content back to the file
                with open(cred_file_path, 'w') as file:
                    file.write(content)
                
                # Update the current values for display
                current_values = {
                    'client_id': new_client_id,
                    'client_id_masked': new_client_id[:5] + '...' + new_client_id[-5:] if new_client_id and len(new_client_id) > 10 else new_client_id,
                    'client_secret': new_client_secret,
                    'client_secret_masked': new_client_secret[:5] + '...' + new_client_secret[-5:] if new_client_secret and len(new_client_secret) > 10 else "••••••••••",
                    'redirect_uri': new_redirect_uri,
                    'scope_string': new_scope_string
                }
                
                # Set success flag
                success = True
                
                # Update the module variables directly
                import spotify.credentials
                spotify.credentials.CLIENT_ID = new_client_id
                spotify.credentials.CLIENT_SECRET = new_client_secret
                spotify.credentials.REDIRECT_URI = new_redirect_uri
                spotify.credentials.SCOPE_STRING = new_scope_string
                
                print(f"Spotify credentials updated successfully!")
                print(f"New Client ID: {new_client_id[:5]}...")
                print(f"New Redirect URI: {new_redirect_uri}")
                
            except Exception as e:
                error = f"Error updating credentials: {str(e)}"
                print(f"Error updating credentials: {str(e)}")
                import traceback
                print(traceback.format_exc())
        else:
            error = "All fields are required!"
    
    context = {
        'current_values': current_values,
        'error': error,
        'success': success
    }
    
    return render(request, 'spotify/setup.html', context)
