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

  if (!roomDetails) return <div>Loading room...</div>;

  return (
    <div>
      <h3>Room Code: {roomCode}</h3>
      <p>Votes to Skip: {roomDetails.votes_to_skip}</p>
      <p>Guest Can Pause: {roomDetails.guest_can_pause ? "Yes" : "No"}</p>
    </div>
  );
}
