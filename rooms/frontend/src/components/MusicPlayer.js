import React, { useState, useEffect } from "react";

export default function MusicPlayer({ roomCode, onAuthChange }) {
  const [song, setSong] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is authenticated with Spotify
  useEffect(() => {
    const checkAuth = () => {
      fetch("/spotify/is-authenticated/")
        .then((response) => response.json())
        .then((data) => {
          setIsAuthenticated(data.status);
          // Pass authentication status to parent component if provided
          if (onAuthChange) {
            onAuthChange(data.status);
          }
          if (!data.status) {
            // If not authenticated, we'll show an authenticate button
            console.log("User not authenticated with Spotify");
          }
        })
        .catch(error => {
          console.error("Error checking Spotify authentication:", error);
          setIsAuthenticated(false);
          if (onAuthChange) {
            onAuthChange(false);
          }
        });
    };

    // Check immediately when component mounts
    checkAuth();
    
    // Set up interval to periodically check authentication status
    const authCheckInterval = setInterval(checkAuth, 60000); // Check every minute
    
    return () => clearInterval(authCheckInterval);
  }, []);

  // States to track component status
  const [roomExists, setRoomExists] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify room exists
  useEffect(() => {
    if (!roomCode) {
      setError("No room code provided");
      setIsLoading(false);
      return;
    }
    
    console.log(`Verifying room exists: ${roomCode}`);
    setIsLoading(true);
    
    // First verify the room exists
    fetch(`/spotify/verify-room/?code=${roomCode}`)
      .then(response => response.json())
      .then(data => {
        console.log("Room verification:", data);
        setRoomExists(data.exists);
        if (!data.exists) {
          setError(`Room with code ${roomCode} does not exist in the database`);
          console.warn(`Room with code ${roomCode} does not exist in the database`);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error verifying room:", error);
        setError("Error verifying room");
        setIsLoading(false);
      });
  }, [roomCode]);

  // Fetch current song info every second
  useEffect(() => {
    const fetchCurrentSong = () => {
      if (!isAuthenticated || !roomExists) return;
      
      console.log(`Fetching current song for room: ${roomCode}`);
      
      fetch(`/spotify/current-song?room_code=${roomCode}`)
        .then((response) => {
          console.log(`Current song response status: ${response.status}`);
          
          // Handle HTTP status codes first
          if (response.status === 204) {
            console.log("No song currently playing");
            return null; // No content - no song playing
          }
          
          if (response.status === 401) {
            // Authentication issue
            console.log("Authentication required (401)");
            setIsAuthenticated(false);
            throw new Error("Spotify authentication required");
          }
          
          // Check content type for debugging
          const contentType = response.headers.get("content-type");
          console.log(`Response content type: ${contentType}`);
          
          // Check if response is actually HTML instead of JSON (error case)
          if (contentType && contentType.includes('text/html')) {
            console.warn('Received HTML response instead of JSON');
            // Show debugging info
            console.log(`Debugging URL: /spotify/api-debug/?room_code=${roomCode}`);
            throw new Error("Received HTML instead of JSON. Server error.");
          }
          
          // Attempt to parse the response as JSON
          return response.json();
        })
        .then((data) => {
          if (!data) {
            // No song playing (204 response)
            console.log("No song data returned");
            setSong(null);
            return;
          }
          
          if (data.error) {
            console.warn(`Error response from Spotify API: ${JSON.stringify(data.error)}`);
            // Handle specific error cases
            if (data.error && typeof data.error === 'string' && 
                data.error.includes("authentication") || data.status === 401) {
              setIsAuthenticated(false);
            }
            // Keep the current song data if it's just a temporary error
            return;
          }
          
          // Successfully got song data
          console.log("Received song data:", data);
          setSong(data);
        })
        .catch((error) => {
          console.error("Error in song fetch process:", error);
          // Network error or other unexpected issue
          // Don't clear song data on every error, to prevent flickering
        });
    };

    // Fetch immediately when component mounts or authentication changes
    if (isAuthenticated) {
      fetchCurrentSong();
    }
    
    // Set up interval to periodically fetch song data
    const interval = setInterval(fetchCurrentSong, 1000);

    return () => clearInterval(interval);
  }, [roomCode, isAuthenticated]);

  const authenticateSpotify = () => {
    // Try to get the auth URL from the API first
    fetch(`/spotify/get-auth-url/?room_code=${roomCode}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          // If that fails, redirect directly to the login URL
          window.location.href = `/spotify/login/?room_code=${roomCode}`;
          throw new Error("Using direct redirect instead");
        }
      })
      .then((data) => {
        window.location.href = data.url;
      })
      .catch((error) => {
        console.log(error);
        // Already redirecting in the error case above
      });
  };

  const pauseSong = () => {
    fetch("/spotify/pause/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_code: roomCode }),
    });
  };

  const playSong = () => {
    fetch("/spotify/play/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_code: roomCode }),
    });
  };

  const skipSong = () => {
    fetch("/spotify/skip/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_code: roomCode }),
    });
  };

  // Format milliseconds into mm:ss format
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Calculate progress percentage
  const progressPercentage = song ? (song.time / song.duration) * 100 : 0;

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          background: "rgba(30, 215, 96, 0.1)",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
          maxWidth: "400px",
          margin: "20px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#1DB954" }}>
          Loading...
        </h3>
        <div style={{ width: "40px", height: "40px", margin: "0 auto", border: "4px solid rgba(29, 185, 84, 0.3)", borderTop: "4px solid #1DB954", borderRadius: "50%", animation: "spin 1s linear infinite" }}>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div
        style={{
          background: "rgba(220, 53, 69, 0.1)",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
          maxWidth: "400px",
          margin: "20px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#dc3545" }}>
          Error
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "0.9rem" }}>
          {error}
        </p>
      </div>
    );
  }
  
  // Room doesn't exist
  if (!roomExists) {
    return (
      <div
        style={{
          background: "rgba(220, 53, 69, 0.1)",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
          maxWidth: "400px",
          margin: "20px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#dc3545" }}>
          Room Not Found
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "0.9rem" }}>
          The room with code {roomCode} does not exist.
        </p>
      </div>
    );
  }

  // If not authenticated with Spotify
  if (!isAuthenticated) {
    return (
      <div
        style={{
          background: "rgba(30, 215, 96, 0.1)",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
          maxWidth: "400px",
          margin: "20px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#1DB954" }}>
          Connect to Spotify
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "0.9rem" }}>
          To control music playback, you need to connect your Spotify account.
        </p>
        <button
          onClick={authenticateSpotify}
          style={{
            background: "#1DB954",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "25px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  // If no song is currently playing
  if (!song) {
    return (
      <div
        style={{
          background: "rgba(30, 215, 96, 0.1)",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
          maxWidth: "400px",
          margin: "20px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ color: "#1DB954" }}>
          No song currently playing
        </h3>
        <p style={{ fontSize: "0.9rem", marginTop: "10px" }}>
          Start playing a song on Spotify to control music here
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(18, 18, 18, 0.95)",
        borderRadius: "12px",
        padding: "20px",
        color: "white",
        maxWidth: "400px",
        margin: "20px auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}
    >
      <div style={{ display: "flex", marginBottom: "15px" }}>
        {/* Album Cover */}
        <img
          src={song.image_url}
          alt={`${song.title} album art`}
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        />

        {/* Song Info */}
        <div style={{ marginLeft: "15px", flex: 1 }}>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: "bold",
              marginBottom: "5px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {song.title}
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              opacity: 0.8,
              marginBottom: "10px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {song.artist}
          </div>
          <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>
            Votes to skip: {song.votes} / {song.votes_needed || "?"}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "15px" }}>
        <div
          style={{
            height: "4px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercentage}%`,
              background: "#1DB954",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.7rem",
            opacity: 0.7,
            marginTop: "5px",
          }}
        >
          <span>{formatTime(song.time)}</span>
          <span>{formatTime(song.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        {song.is_playing ? (
          <button
            onClick={pauseSong}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ⏸️
          </button>
        ) : (
          <button
            onClick={playSong}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ▶️
          </button>
        )}
        <button
          onClick={skipSong}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⏭️
        </button>
      </div>
    </div>
  );
}
