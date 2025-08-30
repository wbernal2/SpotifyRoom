import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

  useEffect(() => {
    fetch(`/api/get-room?code=${roomCode}`)
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
      })
      .catch((err) => {
        console.error("Fetch error:", err);
      });
  }, [roomCode]);

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