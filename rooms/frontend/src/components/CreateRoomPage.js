import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // react-router v6
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
} from "@material-ui/core";

export default function CreateRoomPage() {
  const navigate = useNavigate(); // For navigation after room is created

  const [guestCanPause, setGuestCanPause] = useState(true);
  const [votesToSkip, setVotesToSkip] = useState(2);

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
        // Optionally navigate to the new room page
        // navigate(`/room/${data.code}`);
      });
  };

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} align="center">
        <Typography component="h4" variant="h4">
          Create A Room
        </Typography>
      </Grid>

      <Grid item xs={12} align="center">
        <FormControl component="fieldset">
          <FormHelperText>
            <div align="center">Guest Control of Playback State</div>
          </FormHelperText>
          <RadioGroup
            row
            value={guestCanPause.toString()}
            onChange={(e) => setGuestCanPause(e.target.value === "true")}
          >
            <FormControlLabel
              value="true"
              control={<Radio color="primary" />}
              label="Play/Pause"
              labelPlacement="bottom"
            />
            <FormControlLabel
              value="false"
              control={<Radio color="secondary" />}
              label="No Control"
              labelPlacement="bottom"
            />
          </RadioGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12} align="center">
        <FormControl>
          <TextField
            required
            type="number"
            onChange={(e) => setVotesToSkip(e.target.value)}
            defaultValue={2}
            inputProps={{
              min: 1,
              style: { textAlign: "center" },
            }}
          />
          <FormHelperText>
            <div align="center">Votes Required To Skip Song</div>
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12} align="center">
        <Button color="primary" variant="contained" onClick={handleCreateRoom}>
          Create A Room
        </Button>
      </Grid>

      <Grid item xs={12} align="center">
        <Button color="secondary" variant="contained" href="/">
          Back
        </Button>
      </Grid>
    </Grid>
  );
}
