import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MusicPlayer from "./MusicPlayer";

// Add CSS animation for notification
const notificationStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

// Inject styles into the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = notificationStyles;
  document.head.appendChild(styleSheet);
}

export default function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomDetails, setRoomDetails] = useState(null);
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [guestCanPause, setGuestCanPause] = useState(true);
  const [votesToSkip, setVotesToSkip] = useState(2);
  const [showNotification, setShowNotification] = useState(false);

  const leaveRoom = () => {
    fetch("/api/leave-room/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          navigate("/");
        } else {
          console.error("Failed to leave room");
        }
      })
      .catch((err) => {
        console.error("Error leaving room:", err);
      });
  };

  const updateRoom = () => {
    fetch("/api/update-room/", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guest_can_pause: guestCanPause,
        votes_to_skip: votesToSkip,
        code: roomCode,
      }),
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Failed to update room");
        }
      })
      .then((data) => {
        setRoomDetails(data);
        setIsSettingsMode(false);
        setShowNotification(true);
        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      })
      .catch((err) => {
        console.error("Error updating room:", err);
      });
  };

  const enterSettingsMode = () => {
    setGuestCanPause(roomDetails.guest_can_pause);
    setVotesToSkip(roomDetails.votes_to_skip);
    setIsSettingsMode(true);
  };

  // Check Spotify authentication status
  useEffect(() => {
    const checkSpotifyAuth = () => {
      setCheckingAuth(true);
      console.log("Checking Spotify authentication for room:", roomCode);
      fetch("/spotify/is-authenticated/")
        .then((response) => response.json())
        .then((data) => {
          console.log("Spotify auth status:", data.status);
          setSpotifyAuthenticated(data.status);
          setCheckingAuth(false);
          
          // If we just came back from Spotify auth and got authenticated, show a success message
          const justAuthenticated = sessionStorage.getItem("justAuthenticated");
          if (data.status && justAuthenticated) {
            console.log("Successfully authenticated with Spotify!");
            sessionStorage.removeItem("justAuthenticated");
            // Show success notification
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
          }
        })
        .catch(error => {
          console.error("Error checking Spotify authentication:", error);
          setSpotifyAuthenticated(false);
          setCheckingAuth(false);
        });
    };

    // Check immediately when component mounts
    checkSpotifyAuth();
    
    // Set up interval to periodically check authentication status
    const authCheckInterval = setInterval(checkSpotifyAuth, 30000); // Check every 30 seconds
    
    return () => clearInterval(authCheckInterval);
  }, []);

  useEffect(() => {
    // Try to retrieve roomCode from session storage if coming back from Spotify auth
    const storedRoomCode = sessionStorage.getItem("lastRoomCode");
    const codeToUse = roomCode || storedRoomCode;
    
    console.log("Using room code:", codeToUse);
    console.log("Current URL path:", window.location.pathname);
    
    // If we have a stored room code but we're on the home page, navigate to the room
    if (storedRoomCode && window.location.pathname === "/") {
      console.log("Found stored room code while on home page, redirecting to room");
      navigate(`/room/${storedRoomCode}`);
      return;
    }
    
    if (!codeToUse) {
      console.error("No room code available");
      return;
    }
    
    fetch(`/api/get-room?code=${codeToUse}`)
      .then((res) => {
        console.log("Raw response:", res);
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => {
        console.log("Room details:", data);
        setRoomDetails(data);
        setGuestCanPause(data.guest_can_pause);
        setVotesToSkip(data.votes_to_skip);
        
        // Store the room code in the URL to maintain it on refresh
        if (roomCode !== codeToUse) {
          navigate(`/room/${codeToUse}`, { replace: true });
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        
        // If we can't find the room, go back to home
        setTimeout(() => {
          navigate("/");
        }, 3000);
      });
  }, [roomCode, navigate]);

  if (!roomDetails)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fbb03b, #dd3e54)",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            padding: "2rem 3rem",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            fontFamily: "sans-serif",
            fontSize: "1.2rem",
            color: "#333",
          }}
        >
          Loading room...
        </div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fbb03b, #dd3e54)",
      }}
    >
      {/* Success Notification */}
      {showNotification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "linear-gradient(135deg, #43a047, #388e3c)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(67, 160, 71, 0.3)",
            zIndex: 1000,
            fontSize: "1rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <span>✓</span>
          Room settings updated successfully!
        </div>
      )}
      
      <div
        style={{
          background: "rgba(255,255,255,0.95)",
          padding: "2.5rem 3.5rem",
          borderRadius: "20px",
          boxShadow: "0 6px 32px rgba(0,0,0,0.13)",
          fontFamily: "sans-serif",
          minWidth: "320px",
          maxWidth: "90vw",
        }}
      >
        {!isSettingsMode ? (
          // Normal room details view
          <>
            <h2
              style={{
                marginBottom: "1.5rem",
                color: "#dd3e54",
                letterSpacing: "2px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Room Details
            </h2>
            <div style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
              <strong>Room Code:</strong>{" "}
              <span style={{ fontFamily: "monospace", color: "#1976d2" }}>
                {roomCode}
              </span>
            </div>
            <div style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
              <strong>Votes to Skip:</strong>{" "}
              <span style={{ color: "#1976d2" }}>{roomDetails.votes_to_skip}</span>
            </div>
            <div style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
              <strong>Guest Can Pause:</strong>{" "}
              <span
                style={{
                  color: roomDetails.guest_can_pause ? "#43a047" : "#e53935",
                  fontWeight: "bold",
                }}
              >
                {roomDetails.guest_can_pause ? "Yes" : "No"}
              </span>
            </div>
            
            {/* Spotify Status Indicator */}
            <div style={{ 
              padding: "8px 16px", 
              marginTop: "1rem",
              borderRadius: "8px", 
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              backgroundColor: spotifyAuthenticated ? "rgba(29, 185, 84, 0.1)" : "rgba(255, 55, 55, 0.1)",
              border: `1px solid ${spotifyAuthenticated ? "#1db954" : "#ff5555"}`,
              color: spotifyAuthenticated ? "#1db954" : "#ff5555",
              fontWeight: "bold"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center",
                width: "100%"
              }}>
                <div style={{ 
                  width: "10px", 
                  height: "10px", 
                  borderRadius: "50%", 
                  backgroundColor: spotifyAuthenticated ? "#1db954" : "#ff5555",
                  boxShadow: spotifyAuthenticated ? "0 0 8px #1db954" : "none",
                  animation: spotifyAuthenticated ? "pulse 2s infinite" : "none"
                }}></div>
                {checkingAuth ? (
                  "Checking Spotify connection..."
                ) : (
                  spotifyAuthenticated ? "Connected to Spotify" : "Not connected to Spotify"
                )}
              </div>
              
              {!spotifyAuthenticated && !checkingAuth && (
                <button 
                  onClick={() => {
                    console.log("Connecting to Spotify with room code:", roomCode);
                    // Store room code in multiple storage mechanisms for redundancy
                    sessionStorage.setItem("lastRoomCode", roomCode);
                    localStorage.setItem("spotifyRoomBackup", roomCode);
                    document.cookie = `roomCode=${roomCode}; path=/; max-age=3600`;
                    // Redirect to Spotify login with the room code as state
                    window.location.href = `/spotify/login/?room_code=${roomCode}`;
                  }}
                  style={{
                    backgroundColor: "#1db954",
                    color: "white",
                    border: "none",
                    borderRadius: "24px",
                    padding: "8px 16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    transition: "all 0.3s ease"
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 496 512">
                    <path fill="#ffffff" d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 30.6 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"/>
                  </svg>
                  Connect to Spotify
                </button>
              )}
              
              <style>{`
                @keyframes pulse {
                  0% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.7); }
                  70% { box-shadow: 0 0 0 6px rgba(29, 185, 84, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
                }
              `}</style>
            </div>
            
            {/* Spotify Music Player */}
            <MusicPlayer 
              roomCode={roomCode} 
              onAuthChange={(status) => setSpotifyAuthenticated(status)} 
            />
            
            <div style={{ marginTop: "2rem", textAlign: "center", display: "flex", gap: "1rem", justifyContent: "center" }}>
              {roomDetails.is_host && (
                <button
                  onClick={enterSettingsMode}
                  style={{
                    background: "linear-gradient(135deg, #1976d2, #1565c0)",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                    transition: "all 0.2s ease-in-out",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(25, 118, 210, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 8px rgba(25, 118, 210, 0.3)";
                  }}
                >
                  Settings
                </button>
              )}
              <button
                onClick={leaveRoom}
                style={{
                  background: "linear-gradient(135deg, #e53935, #c62828)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(229, 57, 53, 0.3)",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(229, 57, 53, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 8px rgba(229, 57, 53, 0.3)";
                }}
              >
                Leave Room
              </button>
            </div>
          </>
        ) : (
          // Settings mode view
          <>
            <h2
              style={{
                marginBottom: "1.5rem",
                color: "#dd3e54",
                letterSpacing: "2px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Room Settings
            </h2>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ marginBottom: "0.5rem", fontWeight: "bold", textAlign: "center" }}>
                Guest Control of Playback
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="guestCanPause"
                    checked={guestCanPause}
                    onChange={() => setGuestCanPause(true)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Play/Pause
                </label>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="guestCanPause"
                    checked={!guestCanPause}
                    onChange={() => setGuestCanPause(false)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  No Control
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
              <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                Votes Required To Skip Song
              </div>
              <input
                type="number"
                min="1"
                value={votesToSkip}
                onChange={(e) => setVotesToSkip(parseInt(e.target.value))}
                style={{
                  width: "80px",
                  padding: "8px",
                  textAlign: "center",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div style={{ textAlign: "center", display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={updateRoom}
                style={{
                  background: "linear-gradient(135deg, #43a047, #388e3c)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(67, 160, 71, 0.3)",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(67, 160, 71, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 8px rgba(67, 160, 71, 0.3)";
                }}
              >
                Update Room
              </button>
              <button
                onClick={() => setIsSettingsMode(false)}
                style={{
                  background: "linear-gradient(135deg, #757575, #616161)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(117, 117, 117, 0.3)",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(117, 117, 117, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 8px rgba(117, 117, 117, 0.3)";
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}