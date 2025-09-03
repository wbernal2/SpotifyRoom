from .models import SpotifyToken
from django.utils import timezone
from datetime import timedelta
from .credentials import CLIENT_ID, CLIENT_SECRET
from requests import post, put, get


def get_user_tokens(session_id):
    user_tokens = SpotifyToken.objects.filter(user=session_id)
    if user_tokens.exists():
        return user_tokens[0]
    else:
        return None


def update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token):
    print(f"Updating or creating tokens for session: {session_id}")
    print(f"Token details - Type: {token_type}, Expires in: {expires_in} seconds")
    
    if not session_id:
        print("ERROR: No session_id provided!")
        return None
        
    # Debugging: verify SpotifyToken model connection
    try:
        from django.db import connection
        print(f"Database connection: {connection.ensure_connection()}")
        print(f"Database alias: {connection.alias}")
    except Exception as e:
        print(f"Database connection check failed: {e}")
    
    # Convert expires_in to seconds if it's a string
    try:
        expires_seconds = int(expires_in)
    except (ValueError, TypeError):
        print(f"ERROR: Invalid expires_in value: {expires_in}")
        expires_seconds = 3600  # Default to 1 hour
        
    expires_time = timezone.now() + timedelta(seconds=expires_seconds)
    print(f"Token will expire at: {expires_time}")

    try:
        tokens = get_user_tokens(session_id)
        
        if tokens:
            print(f"Updating existing token for {session_id}")
            tokens.access_token = access_token
            if refresh_token:  # Only update refresh token if provided
                tokens.refresh_token = refresh_token
            tokens.expires_in = expires_time
            tokens.token_type = token_type
            tokens.save(update_fields=['access_token', 'expires_in', 'token_type'])
            if refresh_token:
                tokens.save(update_fields=['refresh_token'])
            print(f"Token updated for {session_id}")
        else:
            print(f"Creating new token for {session_id}")
            # Create token directly with model
            from .models import SpotifyToken
            tokens = SpotifyToken(
                user=session_id, 
                access_token=access_token,
                refresh_token=refresh_token, 
                token_type=token_type, 
                expires_in=expires_time
            )
            tokens.save()
            print(f"New token created for {session_id} with ID: {tokens.id}")
            
        # Double-check token was saved
        verification = get_user_tokens(session_id)
        if verification:
            print(f"Token verification successful: {verification.id}")
        else:
            print("WARNING: Token verification failed!")
            
        return tokens
        
    except Exception as e:
        print(f"EXCEPTION in update_or_create_user_tokens: {e}")
        import traceback
        print(traceback.format_exc())
        return None


def is_spotify_authenticated(session_id):
    print(f"Checking Spotify authentication for session: {session_id}")
    if not session_id:
        print("No session_id provided")
        return False
        
    tokens = get_user_tokens(session_id)
    if tokens:
        print(f"Found tokens for session {session_id}")
        expiry = tokens.expires_in
        current_time = timezone.now()
        print(f"Token expires at: {expiry}, current time: {current_time}")
        
        if expiry <= current_time:
            print("Token expired, refreshing...")
            refresh_spotify_token(session_id)
        else:
            print("Token is still valid")

        return True
    else:
        print(f"No tokens found for session {session_id}")
        return False


def refresh_spotify_token(session_id):
    print(f"Attempting to refresh token for session: {session_id}")
    token_obj = get_user_tokens(session_id)
    if not token_obj:
        print(f"No token found for session {session_id}")
        return False
        
    refresh_token = token_obj.refresh_token

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')

    update_or_create_user_tokens(
        session_id, access_token, token_type, expires_in, refresh_token)


def execute_spotify_api_request(session_id, endpoint, post_=False, put_=False):
    tokens = get_user_tokens(session_id)
    if not tokens:
        print(f"No tokens found for session_id: {session_id}")
        return {'error': {'status': 401, 'message': 'No token available'}}
        
    print(f"Using token for session_id {session_id}, expires at: {tokens.expires_in}")
    print(f"Current time: {timezone.now()}")
    print(f"Token expired: {tokens.expires_in <= timezone.now()}")
    
    headers = {'Content-Type': 'application/json',
               'Authorization': "Bearer " + tokens.access_token}

    # Check if token is expired and refresh if needed
    if tokens.expires_in <= timezone.now():
        print(f"Token expired, refreshing for session {session_id}")
        refresh_spotify_token(session_id)
        # Get updated tokens
        tokens = get_user_tokens(session_id)
        if not tokens:
            print(f"Failed to refresh token for session {session_id}")
            return {'error': {'status': 401, 'message': 'Failed to refresh token'}}
        headers['Authorization'] = "Bearer " + tokens.access_token
        print(f"Token refreshed, new expiry: {tokens.expires_in}")

    # Make the appropriate request type
    print(f"Making {'POST' if post_ else 'PUT' if put_ else 'GET'} request to Spotify API: {endpoint}")
    
    try:
        if post_:
            response = post(f"https://api.spotify.com/v1/me/{endpoint}", headers=headers)
        elif put_:
            response = put(f"https://api.spotify.com/v1/me/{endpoint}", headers=headers)
        else:
            response = get(f"https://api.spotify.com/v1/me/{endpoint}", {}, headers=headers)
            
        print(f"Spotify API response status: {response.status_code}")
    except Exception as e:
        print(f"Error making Spotify API request: {str(e)}")
        return {'error': {'status': 500, 'message': f'Request failed: {str(e)}'}}

    try:
        return response.json()
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Response content (first 100 chars): {response.text[:100] if hasattr(response, 'text') else 'No text attribute'}")
        return {'error': {'status': response.status_code, 'message': 'Issue with request', 'details': str(e)}}
