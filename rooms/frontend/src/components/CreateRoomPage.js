import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Dark theme helpers (same as Room.js)
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
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// Inject styles into the document head (once)
if (typeof document !== "undefined") {
  const id = "create-room-styles";
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
    alignItems: "center"
  },
  panel: {
    maxWidth: "600px",
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "20px",
    border: DARK.border,
    backdropFilter: "blur(10px)",
    padding: "40px"
  },
  title: {
    fontSize: "28px",
    fontWeight: 600,
    textAlign: "center",
    marginBottom: "30px",
    letterSpacing: "0.3px"
  },
  section: {
    border: DARK.border,
    borderRadius: "16px",
    padding: "20px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    marginBottom: "20px"
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: "10px",
    color: DARK.accent,
    fontWeight: 700,
    fontSize: "16px"
  },
  sectionDescription: {
    textAlign: "center",
    color: DARK.muted,
    fontSize: "14px",
    marginBottom: "15px"
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
  input: {
    width: "80px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: DARK.border,
    background: "rgba(255,255,255,0.04)",
    color: DARK.text,
    fontWeight: 600,
    textAlign: "center"
  },
  btns: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "20px"
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
  btnSecondary: {
    background: "linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.05))",
    borderColor: "rgba(255,255,255,.2)"
  },
  roomCodeDisplay: {
    background: "linear-gradient(180deg, rgba(29,185,84,.15), rgba(29,185,84,.08))",
    border: "1px solid rgba(29,185,84,.3)",
    borderRadius: "16px",
    padding: "25px",
    textAlign: "center",
    marginBottom: "20px",
    animation: "fadeIn 0.5s ease-in-out"
  },
  roomCode: {
    fontSize: "32px",
    fontWeight: "700",
    letterSpacing: "4px",
    color: DARK.accent,
    marginBottom: "10px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
  },
  loader: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,.25)",
    borderTopColor: "#fff",
    animation: "spin 1s linear infinite"
  },
  loadingContainer: {
    textAlign: "center",
    padding: "30px"
  },
  center: {
    textAlign: "center"
  }
};

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [guestCanPause, setGuestCanPause] = useState(true);
  const [votesToSkip, setVotesToSkip] = useState(2);
  const [roomCode, setRoomCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(false);

  const handleCreateRoom = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    const body = {
      guest_can_pause: guestCanPause,
      votes_to_skip: Number(votesToSkip) || 1,
    };

    try {
      const res = await fetch("/api/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const data = await res.json();
      const code = data.code;
      setRoomCode(code);
      setShowRoomCode(true);
      setIsLoading(false);
      
      // Store room code in session storage for persistence
      sessionStorage.setItem("lastRoomCode", code);
      
      // Wait 5 seconds before redirecting to give user time to see the code
      setTimeout(() => {
        window.location.href = `/spotify/login/?room_code=${encodeURIComponent(code)}`;
      }, 5000);
    } catch (err) {
      console.error("Create room error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.appWrap}>
      <div style={styles.panel}>
        <h1 style={styles.title}>Create A Room</h1>

        {showRoomCode && roomCode && (
          <div style={styles.roomCodeDisplay}>
            <h3 style={{ margin: "0 0 15px 0", color: DARK.text }}>
              Your Room Code:
            </h3>
            <div style={styles.roomCode}>
              {roomCode}
            </div>
            <p style={{ margin: 0, color: DARK.muted, fontSize: "14px" }}>
              Save this code! Redirecting to Spotify in a few seconds...
            </p>
          </div>
        )}

        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 15 }}>
              <div style={styles.loader}></div>
              <span style={{ color: DARK.text, fontSize: "16px" }}>Creating your room...</span>
            </div>
          </div>
        )}

        {!showRoomCode && !isLoading && (
          <>
            {/* Guest control section */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                Guest Control of Playback
              </div>
              <p style={styles.sectionDescription}>
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

            {/* Votes to skip section */}
            <div style={styles.section}>
              <div style={{...styles.sectionTitle, color: "#ffb3b0"}}>
                Votes Required To Skip Song
              </div>
              <p style={styles.sectionDescription}>
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
                  style={styles.input}
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

            {/* Action buttons */}
            <div style={styles.btns}>
              <button 
                style={{...styles.btn, ...styles.btnPrimary}} 
                onClick={handleCreateRoom}
              >
                Create A Room
              </button>
              <button 
                style={{...styles.btn, ...styles.btnSecondary}} 
                onClick={() => navigate("/")}
              >
                Back
              </button>
            </div>
          </>
        )}
        
        {showRoomCode && (
          <div style={styles.btns}>
            <button
              style={{...styles.btn, ...styles.btnPrimary}}
              onClick={() => window.location.href = `/spotify/login/?room_code=${encodeURIComponent(roomCode)}`}
            >
              Continue to Spotify
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
