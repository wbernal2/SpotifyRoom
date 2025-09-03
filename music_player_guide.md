# SpotifyRoom Music Player Guide

This guide will help you verify that your song display is working correctly in the SpotifyRoom application.

## Prerequisites

1. Make sure you have:
   - Spotify Premium account
   - Django server running
   - React frontend compiled and serving properly
   - Proper Spotify API credentials configured

## Step 1: Verify Spotify Authentication

1. Open your browser and navigate to: http://127.0.0.1:8000/spotify/test-player/
2. If you're not authenticated, click the "Re-authenticate" button
3. Go through the Spotify authentication process
4. You should be redirected back to the test player page

## Step 2: Play a Song on Spotify

1. Open the Spotify app on your device
2. Play any song
3. Return to the test player page and refresh: http://127.0.0.1:8000/spotify/test-player/
4. You should see the currently playing song details

## Step 3: Test the Room Interface

1. Create or join a room: http://127.0.0.1:8000/
2. Once in the room, make sure you're authenticated with Spotify
3. Play a song on Spotify if one isn't already playing
4. The music player in the room should display the current song

## Troubleshooting

If the song doesn't appear:

1. **Check the console** for any error messages
2. **Verify authentication** is working by checking the "Spotify auth status" log in the console
3. **Check the network tab** in your browser's dev tools for any failed requests
4. **Test with the test-player endpoint** to isolate frontend vs backend issues
5. **Make sure the room code** is being properly passed to the MusicPlayer component
6. **Verify that the Spotify account** you're logged into has an active song playing

## Common Issues and Solutions

1. **"Failed to fetch" errors**:
   - Make sure your Django server is running
   - Check that your CORS settings allow the frontend to access the backend

2. **Authentication issues**:
   - Clear cookies and try re-authenticating
   - Check that your Spotify credentials are correct

3. **No song showing**:
   - Make sure you have an active Spotify Premium account
   - Verify a song is actually playing on your Spotify account

4. **CORS errors**:
   - Add the necessary headers to your Django responses
   - Make sure your frontend is making requests to the correct backend URL

## Next Steps

Once the basic song display is working, you can enhance the MusicPlayer component with:

1. Better error handling
2. A more detailed progress bar
3. Volume controls
4. More detailed song information
5. Queue management
