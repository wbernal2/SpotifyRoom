# Spotify API Credentials
# Get these from your Spotify Developer Dashboard: https://developer.spotify.com/dashboard/

# Your Spotify App Client ID
CLIENT_ID = "42097c6d6cf14e62825e18871047b77f"

# Your Spotify App Client Secret
CLIENT_SECRET = "dc9e9aa45dc648079fc474a115f9fb78"

# Redirect URI (must match what you set in Spotify Dashboard)
# Spotify requires explicit IPv4 (127.0.0.1) instead of localhost for security
REDIRECT_URI = "http://127.0.0.1:8000/spotify/redirect"

# Spotify API Scopes (permissions your app needs)
# Common scopes for music control apps:
SCOPES = [
    'user-read-playback-state',      # Read user's playback state
    'user-modify-playback-state',    # Control user's playback (play/pause/skip)
    'user-read-currently-playing',   # Read currently playing track
    'playlist-read-private',         # Read private playlists
    'playlist-read-collaborative',   # Read collaborative playlists
    'user-library-read',            # Read saved tracks/albums
]

# Join scopes into a single string (required for Spotify API)
SCOPE_STRING = ' '.join(SCOPES)

# Spotify API URLs
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1"


