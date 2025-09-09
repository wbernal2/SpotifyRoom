import React, { useState, useEffect } from "react";

// Theme constants for MusicPlayer component
const THEME = {
  bg: "rgba(18, 18, 18, 0.95)",
  cardBg: "rgba(24, 24, 24, 0.95)",
  accent: "#1db954",
  text: "#ffffff",
  textSecondary: "#b3b3b3",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  progressBg: "rgba(255, 255, 255, 0.3)",
  progressFill: "#1db954"
};

// Component styles
const styles = {
  playerContainer: {
    background: THEME.bg,
    borderRadius: "12px",
    padding: "20px",
    color: THEME.text,
    boxShadow: THEME.boxShadow
  },
  notAuthenticated: {
    background: THEME.cardBg,
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: THEME.text,
    minHeight: "120px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px"
  },
  noSong: {
    background: THEME.cardBg,
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: THEME.text,
    minHeight: "120px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  noSongIcon: {
    fontSize: "24px",
    color: THEME.textSecondary,
    marginBottom: "8px"
  },
  songInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    marginBottom: "15px",
    textAlign: "center"
  },
  albumArt: {
    width: "120px",
    height: "120px",
    borderRadius: "12px",
    objectFit: "cover",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
    border: "2px solid rgba(255, 255, 255, 0.1)"
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px",
    color: THEME.text
  },
  artist: {
    fontSize: "14px",
    color: THEME.textSecondary
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "15px"
  },
  button: {
    background: "transparent",
    border: "none",
    color: THEME.text,
    cursor: "pointer",
    fontSize: "16px",
    padding: "8px 12px",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  spotifyButton: {
    background: THEME.accent,
    color: "#000",
    border: "none",
    padding: "10px 15px",
    borderRadius: "20px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "transform 0.2s ease, background-color 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  skipButton: {
    background: "rgba(29, 185, 84, 0.1)",
    border: "2px solid rgba(29, 185, 84, 0.3)",
    color: THEME.accent,
    padding: "16px 24px",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: "140px",
    justifyContent: "center",
    margin: "0 auto"
  },
  skipButtonHover: {
    background: "rgba(29, 185, 84, 0.2)",
    borderColor: "rgba(29, 185, 84, 0.5)",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(29, 185, 84, 0.2)"
  },
  playButton: {
    background: "transparent",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    color: THEME.text,
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  playButtonHover: {
    borderColor: "rgba(255, 255, 255, 0.6)",
    background: "rgba(255, 255, 255, 0.1)"
  },
  skipIcon: {
    width: "16px",
    height: "16px",
    fill: "currentColor"
  },
  playIcon: {
    width: "18px",
    height: "18px",
    fill: "currentColor",
    marginLeft: "2px" // Slight offset for visual centering
  },
  pauseIcon: {
    width: "18px",
    height: "18px",
    fill: "currentColor"
  },
  voteInfo: {
    fontSize: "12px",
    color: THEME.textSecondary,
    marginTop: "8px",
    textAlign: "center"
  },
  progressContainer: {
    width: "100%",
    height: "5px",
    background: THEME.progressBg,
    borderRadius: "3px",
    marginTop: "15px",
    position: "relative"
  },
  progressBar: {
    height: "100%",
    background: THEME.progressFill,
    borderRadius: "3px",
    transition: "width 1s linear"
  },
  timeInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: THEME.textSecondary,
    marginTop: "5px"
  },
  voteText: {
    fontSize: "14px",
    color: THEME.textSecondary,
    marginLeft: "auto"
  }
};

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

  // Format time from ms to mm:ss
  const formatTime = (ms) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

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

  // Loading state
  if (isLoading) {
    return (
      <div style={{...styles.noSong, background: THEME.cardBg}}>
        <h3 style={{ marginBottom: "15px", color: THEME.accent }}>
          Loading...
        </h3>
        <div style={styles.loader}></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div style={{...styles.noSong, background: "rgba(220, 53, 69, 0.15)"}}>
        <h3 style={{ marginBottom: "15px", color: "#dc3545" }}>
          Error
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "0.9rem", color: THEME.textSecondary }}>
          {error}
        </p>
      </div>
    );
  }
  
  // Room doesn't exist
  if (!roomExists) {
    return (
      <div style={{...styles.noSong, background: "rgba(220, 53, 69, 0.15)"}}>
        <h3 style={{ marginBottom: "15px", color: "#dc3545" }}>
          Room Not Found
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "0.9rem", color: THEME.textSecondary }}>
          The room with code {roomCode} does not exist.
        </p>
      </div>
    );
  }

  // If not authenticated with Spotify
  if (!isAuthenticated) {
    return (
      <div style={styles.notAuthenticated}>
        <h3 style={{ marginBottom: "15px", color: THEME.accent }}>
          Connect to Spotify
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "0.9rem", color: THEME.textSecondary }}>
          To control music playback, you need to connect your Spotify account.
        </p>
        <button
          onClick={authenticateSpotify}
          style={styles.spotifyButton}
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
      <div style={styles.noSong}>
        <div style={styles.noSongIcon}>🎵</div>
        <h3 style={{ color: THEME.accent, margin: "0 0 10px 0" }}>
          No song currently playing
        </h3>
        <p style={{ fontSize: "0.9rem", margin: 0, color: THEME.textSecondary }}>
          Start playing a song on Spotify to control music here
        </p>
      </div>
    );
  }

  const progressPercentage = (song.time / song.duration) * 100 || 0;

  return (
    <div style={styles.playerContainer}>
      <div style={styles.songInfo}>
        {/* Album Cover - Centered */}
        <img
          src={song.image_url}
          alt={`${song.title} album art`}
          style={styles.albumArt}
        />

        {/* Song Info - Centered Below Album */}
        <div style={{ width: "100%", maxWidth: "300px" }}>
          <div style={{
            ...styles.title,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center"
          }}>
            {song.title}
          </div>
          <div style={{
            ...styles.artist,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center"
          }}>
            {song.artist}
          </div>
          <div style={{
            ...styles.voteInfo,
            marginTop: "8px",
            textAlign: "center"
          }}>
            Votes to skip: {song.votes} / {song.votes_needed || "?"}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div
          style={{
            ...styles.progressBar,
            width: `${progressPercentage}%`
          }}
        />
      </div>
      <div style={styles.timeInfo}>
        <span>{formatTime(song.time)}</span>
        <span>{formatTime(song.duration)}</span>
      </div>

      {/* Controls */}
      <div style={{...styles.controls, justifyContent: "center"}}>
        {song.is_playing ? (
          <button
            onClick={pauseSong}
            style={styles.playButton}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, styles.playButtonHover);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, styles.playButton);
            }}
            aria-label="Pause"
          >
            <svg style={styles.pauseIcon} viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={playSong}
            style={styles.playButton}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, styles.playButtonHover);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, styles.playButton);
            }}
            aria-label="Play"
          >
            <svg style={styles.playIcon} viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>
        )}
      </div>

      {/* Prominent Skip Button with Vote Info - Centered */}
      <div style={{ marginTop: "24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <button
          onClick={skipSong}
          style={styles.skipButton}
          onMouseEnter={(e) => {
            Object.assign(e.target.style, {...styles.skipButton, ...styles.skipButtonHover});
          }}
          onMouseLeave={(e) => {
            Object.assign(e.target.style, styles.skipButton);
          }}
          aria-label="Skip Song"
        >
          <svg style={styles.skipIcon} viewBox="0 0 24 24">
            <polygon points="5,4 15,12 5,20"/>
            <line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
          <span>Skip Song</span>
        </button>
        
        <div style={styles.voteInfo}>
          Votes to skip: {song.votes || 0} / {song.votes_needed || "?"}
        </div>
      </div>
    </div>
  );
}
