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

  const handleCreateRoom = () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest_can_pause: guestCanPause,
        votes_to_skip: votesToSkip,
      }),
    };

    fetch("/api/create/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log("Room created:", data);
        navigate(`/room/${data.code}`);
      });
  };

  const gradientStyle = {
    background: darkMode
      ? "linear-gradient(135deg, #0f0f0f, #1c1c1c)"
      : "linear-gradient(to right, #dd3e54, #fbb03b)", // sunset gradient like HomePage
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
                  onChange={(e) => setVotesToSkip(e.target.value)}
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
                href="/"
                style={{
                  borderRadius: "8px",
                  padding: "0.6rem 2rem",
                  fontWeight: "bold",
                }}
              >
                Back
              </Button>
            </Grid>
          </Grid>
        </Grow>
      </Grid>
    </div>
  );
}
