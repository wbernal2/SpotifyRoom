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
    <div style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}>
      <h2 style={{ color: "blue" }}>Join a Room</h2>
      <form onSubmit={handleJoin}>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          style={{
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginRight: "1rem",
            width: "200px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "none",
            background: "#1976d2",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Join
        </button>
      </form>
    </div>
  );
}
