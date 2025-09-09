import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MusicPlayer from "./MusicPlayer";
import ChatPanel from "./ChatPanel";

// Dark theme helpers
const DARK = {
  bg: "radial-gradient(1200px 800px at 70% -200px, #1a1c22 0%, transparent 60%), radial-gradient(900px 700px at -100px 80%, #12131a 0%, transparent 55%), #0b0b0f",
  cardBg: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  text: "#e8e9ed",
  muted: "#a0a3aa",
  accent: "#1db954",
  danger: "#ff3b30",
  danger2: "#ff6b62"
};

// Global keyframes CSS
const notificationStyles = `
  @keyframes slideIn {
    from { transform: translateX(20px); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.6); }
    70% { box-shadow: 0 0 0 8px rgba(29, 185, 84, 0); }
    100% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// Inject styles into the document head (once)
if (typeof document !== "undefined") {
  const id = "room-dark-styles";
  if (!document.getElementById(id)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = id;
    styleSheet.type = "text/css";
    styleSheet.innerText = notificationStyles;
    document.head.appendChild(styleSheet);
  }
}

// Styles as React objects
const styles = {
  appWrap: {
    background: DARK.bg,
    minHeight: "100vh",
    color: DARK.text,
    padding: "30px 20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start"
  },
  panel: {
    maxWidth: "800px",
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "20px",
    border: DARK.border,
    backdropFilter: "blur(10px)",
    padding: "28px clamp(20px, 3.5vw, 40px)"
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "18px"
  },
  hTitle: {
    margin: 0,
    fontSize: "20px",
    letterSpacing: "0.3px",
    fontWeight: 600
  },
  codePill: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12px",
    padding: "6px 10px",
    border: DARK.border,
    borderRadius: "999px",
    color: DARK.muted,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
  },
  section: {
    border: DARK.border,
    borderRadius: "16px",
    padding: "16px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    marginBottom: "18px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px 18px"
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "10px 12px",
    borderRadius: "12px"
  },
  label: {
    color: DARK.muted,
    fontSize: "14px"
  },
  value: {
    fontWeight: 600
  },
  valueYes: {
    color: DARK.accent
  },
  valueNo: {
    color: DARK.danger
  },
  status: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px 16px",
    borderRadius: "12px",
    border: DARK.border,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    textAlign: "center",
    marginBottom: "18px"
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    boxShadow: "0 0 0 0 rgba(0,0,0,0)"
  },
  btns: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "18px"
  },
  btn: {
    appearance: "none",
    border: DARK.border,
    background: "rgba(255,255,255,0.04)",
    color: DARK.text,
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    transition: "transform .15s ease, box-shadow .15s ease, border-color .15s ease, background .15s ease"
  },
  btnPrimary: {
    background: "linear-gradient(180deg, rgba(29,185,84,.24), rgba(29,185,84,.18))",
    borderColor: "rgba(29,185,84,.35)"
  },
  btnDanger: {
    background: "linear-gradient(180deg, rgba(255,59,48,.22), rgba(255,59,48,.14))",
    borderColor: "rgba(255,59,48,.35)"
  },
  btnGhost: {
    background: "transparent"
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: DARK.border,
    background: "rgba(255,255,255,0.04)",
    color: DARK.text,
    fontWeight: 600,
    textAlign: "center"
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },
  circle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    border: DARK.border,
    background: "rgba(255,255,255,0.04)",
    color: DARK.text,
    fontSize: "18px",
    cursor: "pointer",
    userSelect: "none",
    transition: "background .15s ease, border-color .15s ease"
  },
  segment: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  segmentLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "999px",
    cursor: "pointer",
    border: DARK.border,
    background: "rgba(255,255,255,0.03)",
    color: DARK.text,
    fontSize: "14px",
    transition: "border-color .15s ease, background .15s ease"
  },
  segmentActive: {
    borderColor: "rgba(29,185,84,.55)",
    background: "rgba(29,185,84,.08)"
  },
  toast: {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0c1a12",
    background: "linear-gradient(180deg, rgba(46,204,113,.9), rgba(39,174,96,.9))",
    padding: "12px 16px",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    animation: "slideIn .25s ease-out"
  },
  check: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#0c1a12",
    color: "#2ecc71",
    fontWeight: 900
  },
  loader: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,.25)",
    borderTopColor: "#fff",
    animation: "spin 1s linear infinite"
  },
  center: {
    textAlign: "center"
  }
};

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatName, setChatName] = useState(() => localStorage.getItem("chatName") || "");
  const [showNameModal, setShowNameModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState({ isUpdating: false, error: null });

  const leaveRoom = () => {
    fetch("/api/leave-room/", { method: "POST", headers: { "Content-Type": "application/json" }})
      .then((res) => {
        if (res.ok) navigate("/");
        else console.error("Failed to leave room");
      })
      .catch((err) => console.error("Error leaving room:", err));
  };

  const updateRoom = () => {
    setUpdateStatus({ isUpdating: true, error: null });
    fetch("/api/update-room/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_can_pause: guestCanPause, votes_to_skip: votesToSkip, code: roomCode }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to update room settings"))))
      .then((data) => {
        setRoomDetails(data);
        setIsSettingsMode(false);
        setUpdateStatus({ isUpdating: false, error: null });
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2800);
      })
      .catch((err) => {
        console.error("Error updating room:", err);
        setUpdateStatus({ isUpdating: false, error: err.message || "Error updating room settings" });
      });
  };

  const enterSettingsMode = () => {
    setGuestCanPause(roomDetails.guest_can_pause);
    setVotesToSkip(roomDetails.votes_to_skip);
    setIsSettingsMode(true);
  };

  // Spotify auth status
  useEffect(() => {
    const checkSpotifyAuth = () => {
      setCheckingAuth(true);
      fetch("/spotify/is-authenticated/")
        .then((r) => r.json())
        .then((data) => {
          setSpotifyAuthenticated(data.status);
          setCheckingAuth(false);
          const justAuthenticated = sessionStorage.getItem("justAuthenticated");
          if (data.status && justAuthenticated) {
            sessionStorage.removeItem("justAuthenticated");
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 2800);
          }
        })
        .catch((error) => {
          console.error("Error checking Spotify authentication:", error);
          setSpotifyAuthenticated(false);
          setCheckingAuth(false);
        });
    };
    checkSpotifyAuth();
    const authCheckInterval = setInterval(checkSpotifyAuth, 30000);
    return () => clearInterval(authCheckInterval);
  }, []);

  // Load room details / handle return from auth
  useEffect(() => {
    const storedRoomCode = sessionStorage.getItem("lastRoomCode");
    const codeToUse = roomCode || storedRoomCode;

    if (storedRoomCode && window.location.pathname === "/") {
      navigate(`/room/${storedRoomCode}`);
      return;
    }
    if (!codeToUse) return;

    fetch(`/api/get-room?code=${codeToUse}`)
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => {
        setRoomDetails(data);
        setGuestCanPause(data.guest_can_pause);
        setVotesToSkip(data.votes_to_skip);
        if (roomCode !== codeToUse) navigate(`/room/${codeToUse}`, { replace: true });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setTimeout(() => navigate("/"), 2000);
      });
  }, [roomCode, navigate]);

  if (!roomDetails) {
    return (
      <div style={styles.appWrap}>
        <div style={{...styles.panel, display: "grid", placeItems: "center", minWidth: 280}}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={styles.loader}></div>
            <div style={styles.label}>Loading room…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appWrap}>
      {/* Toast */}
      {showNotification && (
        <div style={styles.toast}>
          <div style={styles.check}>✓</div>
          <strong>Room updated</strong>
        </div>
      )}

      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.hTitle}>{isSettingsMode ? "Room Settings" : "Room Details"}</h2>
          <span style={styles.codePill}>Code: {roomCode}</span>
        </div>

        {!isSettingsMode ? (
          <>
            <div style={styles.section}>
              <div style={styles.grid}>
                <div style={styles.row}>
                  <span style={styles.label}>Votes to Skip</span>
                  <span style={styles.value}>{roomDetails.votes_to_skip}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.label}>Guest Can Pause</span>
                  <span style={{
                    ...styles.value, 
                    ...(roomDetails.guest_can_pause ? styles.valueYes : styles.valueNo)
                  }}>
                    {roomDetails.guest_can_pause ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Spotify Status */}
            <div style={styles.status}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    ...styles.dot,
                    backgroundColor: spotifyAuthenticated ? DARK.accent : DARK.danger,
                    animation: spotifyAuthenticated ? "pulse 2s infinite" : "none"
                  }}
                />
                <strong>
                  {checkingAuth ? "Checking Spotify connection…" : spotifyAuthenticated ? "Connected to Spotify" : "Not connected to Spotify"}
                </strong>
              </div>

              {!spotifyAuthenticated && !checkingAuth && (
                <button
                  style={{...styles.btn, ...styles.btnPrimary}}
                  onClick={() => {
                    sessionStorage.setItem("lastRoomCode", roomCode);
                    localStorage.setItem("spotifyRoomBackup", roomCode);
                    document.cookie = `roomCode=${roomCode}; path=/; max-age=3600`;
                    window.location.href = `/spotify/login/?room_code=${roomCode}`;
                  }}
                >
                  Connect to Spotify
                </button>
              )}
            </div>

            {/* Music Player in a subtle card */}
            <div style={{...styles.section, padding: 0}}>
              <MusicPlayer roomCode={roomCode} onAuthChange={(s) => setSpotifyAuthenticated(s)} />
            </div>

            <div style={styles.btns}>
              {roomDetails.is_host && (
                <button style={{...styles.btn, ...styles.btnPrimary}} onClick={enterSettingsMode}>
                  Room Settings
                </button>
              )}
              <button 
                style={{
                  ...styles.btn, 
                  background: "#1d4ed8", 
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: DARK.text,
                  transition: "all 0.2s ease"
                }} 
                onClick={() => {
                  if (!chatName.trim()) {
                    setShowNameModal(true);
                  } else {
                    setIsChatOpen(!isChatOpen);
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#1e40af";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#1d4ed8";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Chat
              </button>
              <button style={{...styles.btn, ...styles.btnDanger}} onClick={leaveRoom}>
                Leave Room
              </button>
            </div>

            {/* Chat Panel */}
            {isChatOpen && (
              <div style={{...styles.section, padding: 0, marginTop: 16}}>
                <ChatPanel roomCode={roomCode} userName={chatName} />
              </div>
            )}
          </>
        ) : (
          <>
            <p style={{...styles.center, color: DARK.muted, marginTop: -2, marginBottom: 14}}>
              Customize how guests interact with this room.
            </p>

            {/* Guest control */}
            <div style={styles.section}>
              <div style={{...styles.center, marginBottom: 10, color: DARK.accent, fontWeight: 700}}>
                Guest Control of Playback
              </div>
              <p style={{...styles.center, color: DARK.muted, marginTop: 0, marginBottom: 12, fontSize: 14}}>
                Choose whether guests can play/pause or if only the host has control.
              </p>
              <div style={styles.segment}>
                <label style={{
                  ...styles.segmentLabel,
                  ...(guestCanPause ? styles.segmentActive : {})
                }}>
                  <input
                    type="radio"
                    name="guestCanPause"
                    checked={guestCanPause}
                    onChange={() => setGuestCanPause(true)}
                    style={{ accentColor: DARK.accent }}
                  />
                  Guests Can Play/Pause
                </label>
                <label style={{
                  ...styles.segmentLabel,
                  ...(!guestCanPause ? styles.segmentActive : {})
                }}>
                  <input
                    type="radio"
                    name="guestCanPause"
                    checked={!guestCanPause}
                    onChange={() => setGuestCanPause(false)}
                    style={{ accentColor: DARK.accent }}
                  />
                  Host Control Only
                </label>
              </div>
            </div>

            {/* Votes to skip */}
            <div style={styles.section}>
              <div style={{...styles.center, marginBottom: 10, color: "#ffb3b0", fontWeight: 700}}>
                Votes Required To Skip Song
              </div>
              <p style={{...styles.center, color: DARK.muted, marginTop: 0, marginBottom: 14, fontSize: 14}}>
                Set how many votes are required to skip the current song.
              </p>
              <div style={styles.stepper}>
                <button
                  style={{
                    ...styles.circle,
                    opacity: votesToSkip <= 1 ? 0.4 : 1,
                    cursor: votesToSkip <= 1 ? "not-allowed" : "pointer"
                  }}
                  disabled={votesToSkip <= 1}
                  onClick={() => votesToSkip > 1 && setVotesToSkip(votesToSkip - 1)}
                  aria-label="Decrease votes"
                >
                  –
                </button>
                <input
                  style={{...styles.input, maxWidth: 88}}
                  type="number"
                  min="1"
                  value={votesToSkip}
                  onChange={(e) => setVotesToSkip(parseInt(e.target.value) || 1)}
                />
                <button
                  style={styles.circle}
                  onClick={() => setVotesToSkip(votesToSkip + 1)}
                  aria-label="Increase votes"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.btns}>
              <button 
                style={{
                  ...styles.btn,
                  ...(updateStatus.isUpdating ? {} : styles.btnPrimary)
                }} 
                onClick={updateRoom} 
                disabled={updateStatus.isUpdating}
              >
                {updateStatus.isUpdating ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <span style={styles.loader}></span> Saving…
                  </span>
                ) : (
                  "Save Room Settings"
                )}
              </button>
              <button style={{...styles.btn, ...styles.btnGhost}} onClick={() => setIsSettingsMode(false)}>
                Cancel
              </button>
            </div>

            {updateStatus.error && (
              <p style={{...styles.center, color: DARK.danger, marginTop: 12}}>
                {updateStatus.error}
              </p>
            )}
          </>
        )}
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: DARK.cardBg,
            border: DARK.border,
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "400px",
            width: "90%",
            backdropFilter: "blur(20px)"
          }}>
            <h3 style={{
              color: DARK.text,
              marginBottom: "16px",
              fontSize: "18px",
              fontWeight: "600",
              textAlign: "center"
            }}>
              Enter Your Chat Name
            </h3>
            <input
              type="text"
              placeholder="Your name (1-24 characters)"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              maxLength={24}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.08)",
                border: DARK.border,
                borderRadius: "8px",
                padding: "12px",
                color: DARK.text,
                fontSize: "14px",
                marginBottom: "16px",
                outline: "none"
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && chatName.trim().length >= 1) {
                  localStorage.setItem("chatName", chatName.trim());
                  setChatName(chatName.trim());
                  setShowNameModal(false);
                  setIsChatOpen(true);
                }
              }}
              autoFocus
            />
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end"
            }}>
              <button
                style={{...styles.btn, ...styles.btnGhost}}
                onClick={() => setShowNameModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.btn,
                  ...(chatName.trim().length >= 1 ? styles.btnPrimary : {}),
                  opacity: chatName.trim().length >= 1 ? 1 : 0.5,
                  cursor: chatName.trim().length >= 1 ? "pointer" : "not-allowed"
                }}
                disabled={chatName.trim().length < 1}
                onClick={() => {
                  if (chatName.trim().length >= 1) {
                    localStorage.setItem("chatName", chatName.trim());
                    setChatName(chatName.trim());
                    setShowNameModal(false);
                    setIsChatOpen(true);
                  }
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
