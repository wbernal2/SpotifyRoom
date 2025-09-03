import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Grid,
  Typography,
  TextField,
  FormHelperText,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Tooltip,
  Switch,
  Grow,
} from "@mui/material";

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [guestCanPause, setGuestCanPause] = useState(true);
  const [votesToSkip, setVotesToSkip] = useState(2);
  const [darkMode, setDarkMode] = useState(false);

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

  const gradientStyle = {
    background: darkMode
      ? "linear-gradient(135deg, #0f0f0f, #1c1c1c)"
      : "linear-gradient(to right, #dd3e54, #fbb03b)",
    minHeight: "100vh",
    padding: "2rem",
    color: darkMode ? "#fff" : "#000",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  return (
    <div style={gradientStyle}>
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} align="center">
          <Typography variant="h3" style={{ fontWeight: "bold" }}>
            Create A Room
          </Typography>
        </Grid>

        {showRoomCode && roomCode && (
          <Grid item xs={12} align="center">
            <div style={{
              background: "rgba(255, 255, 255, 0.9)",
              padding: "20px",
              borderRadius: "10px",
              margin: "20px 0",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              animation: "fadeIn 0.5s ease-in-out"
            }}>
              <Typography variant="h5" style={{ marginBottom: "10px" }}>
                Your Room Code:
              </Typography>
              <Typography variant="h3" style={{ 
                fontWeight: "bold", 
                letterSpacing: "3px",
                color: "#1DB954", // Spotify green
                marginBottom: "15px"
              }}>
                {roomCode}
              </Typography>
              <Typography variant="body1">
                Save this code! Redirecting to Spotify in a few seconds...
              </Typography>
            </div>
          </Grid>
        )}

        {isLoading && (
          <Grid item xs={12} align="center">
            <div style={{ padding: "20px" }}>
              <Typography variant="h6">Creating your room...</Typography>
              <div style={{
                width: "40px",
                height: "40px",
                margin: "20px auto",
                border: "4px solid rgba(255,255,255,0.3)",
                borderRadius: "50%",
                borderTop: "4px solid " + (darkMode ? "#fff" : "#000"),
                animation: "spin 1s linear infinite",
              }}></div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>
          </Grid>
        )}

        <Grid item xs={12} align="center">
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
            }
            label="Dark Mode"
            style={{ color: darkMode ? "#fff" : "#000" }}
          />
        </Grid>

        <Divider style={{ width: "60%", margin: "1rem auto" }} />

        <Grow in={true}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} align="center">
              <FormControl>
                <FormHelperText style={{ textAlign: "center", fontWeight: "bold" }}>
                  Guest Control of Playback State
                </FormHelperText>
                <RadioGroup
                  row
                  value={guestCanPause.toString()}
                  onChange={(e) => setGuestCanPause(e.target.value === "true")}
                >
                  <Tooltip title="Allow guests to pause and play music.">
                    <FormControlLabel
                      value="true"
                      control={<Radio color="primary" />}
                      label="Play/Pause"
                      labelPlacement="bottom"
                    />
                  </Tooltip>
                  <Tooltip title="Guests will not be able to control playback.">
                    <FormControlLabel
                      value="false"
                      control={<Radio color="secondary" />}
                      label="No Control"
                      labelPlacement="bottom"
                    />
                  </Tooltip>
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} align="center">
              <FormControl>
                <TextField
                  required
                  type="number"
                  value={votesToSkip}
                  onChange={(e) => setVotesToSkip(Number(e.target.value) || 1)}
                  inputProps={{
                    min: 1,
                    style: {
                      textAlign: "center",
                      color: darkMode ? "#fff" : "#000",
                    },
                  }}
                  style={{
                    backgroundColor: darkMode ? "#333" : "#fff",
                    borderRadius: "8px",
                    width: "100px",
                  }}
                />
                <FormHelperText style={{ textAlign: "center", fontWeight: "bold" }}>
                  Votes Required To Skip Song
                </FormHelperText>
              </FormControl>
            </Grid>

            <Divider style={{ width: "60%", margin: "1rem auto" }} />

            {!showRoomCode && !isLoading && (
              <>
                <Grid item xs={12} align="center">
                  <Button
                    color="primary"
                    variant="contained"
                    onClick={handleCreateRoom}
                    style={{
                      borderRadius: "8px",
                      padding: "0.6rem 2rem",
                      fontWeight: "bold",
                    }}
                  >
                    Create A Room
                  </Button>
                </Grid>

                <Grid item xs={12} align="center">
                  <Button
                    color="secondary"
                    variant="contained"
                    onClick={() => navigate("/")}
                    style={{
                      borderRadius: "8px",
                      padding: "0.6rem 2rem",
                      fontWeight: "bold",
                    }}
                  >
                    Back
                  </Button>
                </Grid>
              </>
            )}
            
            {showRoomCode && (
              <Grid item xs={12} align="center">
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => window.location.href = `/spotify/login/?room_code=${encodeURIComponent(roomCode)}`}
                  style={{
                    borderRadius: "8px",
                    padding: "0.6rem 2rem",
                    fontWeight: "bold",
                    backgroundColor: "#1DB954", // Spotify green
                  }}
                >
                  Continue to Spotify
                </Button>
              </Grid>
            )}
          </Grid>
        </Grow>
      </Grid>
    </div>
  );
}
