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
    tokens = get_user_tokens(session_id)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if tokens:
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.token_type = token_type
        tokens.save(update_fields=['access_token',
                                   'refresh_token', 'expires_in', 'token_type'])
    else:
        tokens = SpotifyToken(user=session_id, access_token=access_token,
                              refresh_token=refresh_token, token_type=token_type, expires_in=expires_in)
        tokens.save()


def is_spotify_authenticated(session_id):
    tokens = get_user_tokens(session_id)
    if tokens:
        expiry = tokens.expires_in
        if expiry <= timezone.now():
            refresh_spotify_token(session_id)

        return True

    return False


def refresh_spotify_token(session_id):
    refresh_token = get_user_tokens(session_id).refresh_token

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
        return {'error': {'status': 401, 'message': 'No token available'}}
        
    headers = {'Content-Type': 'application/json',
               'Authorization': "Bearer " + tokens.access_token}

    # Check if token is expired and refresh if needed
    if tokens.expires_in <= timezone.now():
        refresh_spotify_token(session_id)
        # Get updated tokens
        tokens = get_user_tokens(session_id)
        headers['Authorization'] = "Bearer " + tokens.access_token

    # Make the appropriate request type
    if post_:
        response = post(f"https://api.spotify.com/v1/me/{endpoint}", headers=headers)
    elif put_:
        response = put(f"https://api.spotify.com/v1/me/{endpoint}", headers=headers)
    else:
        response = get(f"https://api.spotify.com/v1/me/{endpoint}", {}, headers=headers)

    try:
        return response.json()
    except Exception as e:
        print(f"Error parsing response: {e}")
        return {'error': {'status': response.status_code, 'message': 'Issue with request'}}
