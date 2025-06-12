import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Grid } from "@material-ui/core";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        textAlign: "center",
        background: "linear-gradient(to right, #d53369, #daae51)",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography variant="h3" style={{ fontWeight: "bold", marginBottom: "1rem" }}>
        🎵 Welcome to Spotify Rooms
      </Typography>
      <Typography variant="h6" style={{ marginBottom: "2rem" }}>
        Listen together, vibe together.
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        <Grid item>
          <Button variant="contained" color="primary" onClick={() => navigate("/create")}>
            Create Room
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" color="inherit" onClick={() => navigate("/join")}>
            Join Room
          </Button>
        </Grid>
      </Grid>
    </div>
  );
}
