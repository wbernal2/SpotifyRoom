import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Room() {
  const { roomCode } = useParams();
  const [roomDetails, setRoomDetails] = useState(null);

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
      </div>
    </div>
  );
}
