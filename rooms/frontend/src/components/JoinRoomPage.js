import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
          background: "rgba(255,255,255,0.95)",
          padding: "2.5rem 3.5rem",
          borderRadius: "20px",
          boxShadow: "0 6px 32px rgba(0,0,0,0.13)",
          fontFamily: "sans-serif",
          minWidth: "320px",
          maxWidth: "90vw",
        }}
      >
        <h2
          style={{
            marginBottom: "1.5rem",
            color: "#dd3e54",
            letterSpacing: "2px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Join a Room
        </h2>
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            style={{
              padding: "0.5rem",
              fontSize: "1.1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginRight: "1rem",
              width: "200px",
              background: "#f7f7f7",
              color: "#1976d2",
              fontWeight: "bold",
              letterSpacing: "1px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.6rem 2rem",
              fontSize: "1.1rem",
              borderRadius: "8px",
              border: "none",
              background: "#1976d2",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
              letterSpacing: "1px",
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
              transition: "background 0.2s",
            }}
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
