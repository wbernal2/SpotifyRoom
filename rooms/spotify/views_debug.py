def spotify_debug_view(request):
    """Debug view to test Spotify authentication"""
    # Ensure session exists
    if not request.session.exists(request.session.session_key):
        request.session.create()
    
    session_key = request.session.session_key
    is_authenticated = is_spotify_authenticated(session_key)
    token = get_user_tokens(session_key)
    
    context = {
        'is_authenticated': is_authenticated,
        'session_key': session_key,
        'token': token,
    }
    
    return render(request, 'spotify/debug.html', context)
