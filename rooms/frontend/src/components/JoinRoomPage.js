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
  danger: "#ff3b30"
};

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
    maxWidth: "450px",
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "20px",
    border: DARK.border,
    backdropFilter: "blur(10px)",
    padding: "40px",
    textAlign: "center"
  },
  title: {
    fontSize: "28px",
    fontWeight: 600,
    marginBottom: "30px",
    letterSpacing: "0.3px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    alignItems: "center"
  },
  input: {
    padding: "14px 16px",
    fontSize: "16px",
    borderRadius: "12px",
    border: DARK.border,
    background: "rgba(255,255,255,0.04)",
    color: DARK.text,
    fontWeight: 600,
    textAlign: "center",
    letterSpacing: "2px",
    outline: "none",
    width: "200px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
  },
  btn: {
    appearance: "none",
    border: DARK.border,
    background: "linear-gradient(180deg, rgba(29,185,84,.24), rgba(29,185,84,.18))",
    borderColor: "rgba(29,185,84,.35)",
    color: DARK.text,
    padding: "14px 24px",
    borderRadius: "12px",
    fontWeight: 600,
    fontSize: "16px",
    cursor: "pointer",
    transition: "transform .15s ease, box-shadow .15s ease, border-color .15s ease, background .15s ease",
    minWidth: "120px"
  },
  btnSecondary: {
    background: "linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.05))",
    borderColor: "rgba(255,255,255,.2)"
  },
  btns: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "10px"
  }
};

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <div style={styles.appWrap}>
      <div style={styles.panel}>
        <h1 style={styles.title}>Join a Room</h1>
        <form onSubmit={handleJoin} style={styles.form}>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            style={styles.input}
            maxLength={6}
          />
          <div style={styles.btns}>
            <button type="submit" style={styles.btn}>
              Join Room
            </button>
            <button 
              type="button" 
              style={{...styles.btn, ...styles.btnSecondary}} 
              onClick={() => navigate("/")}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
