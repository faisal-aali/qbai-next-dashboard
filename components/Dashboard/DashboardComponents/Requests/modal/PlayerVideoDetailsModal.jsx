import React, { useEffect, useState } from "react";
import { Modal, Box, Typography, Grid, IconButton, Divider, CircularProgress } from "@mui/material"; // Import Divider
import CloseIcon from "@mui/icons-material/Close";
import axios from 'axios';
import { convertDoBToAge, getCloudFrontUrl } from "@/util/utils";
import VideoPlayer from "@/components/Common/VideoPlayer/VideoPlayer";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "#020716",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  // maxWidth: "700px",
  maxHeight: "90vh",
  overflowY: "auto",
  color: "white",
  outline: "none",
};

const CustomLinearProgress = ({ value, color }) => {
  const progressStyle = {
    height: 3,
    borderRadius: 0,
    backgroundColor: "#E0E0E0",
  };

  const barStyle = {
    height: "100%",
    backgroundColor: color,
    width: `${value}%`,
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>{`${Math.round(value)}%`}</Typography>
      <Box sx={progressStyle}>
        <Box sx={barStyle} />
      </Box>
    </Box>
  );
};

const PlayerVideoDetailsModal = ({ open, onClose, request, fileUrl }) => {
  const player = request.user
  const [video, setVideo] = useState()
  const [videoSrc, setVideoSrc] = useState('')

  const metrics = video?.assessmentDetails?.stats?.metrics;

  useEffect(() => {
    setVideo()
    fetchVideo()
  }, [request])

  const fetchVideo = () => {
    axios.get('/api/videos', { params: { id: request.entityId } }).then(res => {
      setVideo(res.data[0])
    }).catch(console.error)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} className="w-full max-w-xl px-16">
        {!video || !metrics ? <CircularProgress /> :
          <div>
            <Box>
              <IconButton
                sx={{ position: "absolute", top: 15, right: 15, color: "#fff" }}
                onClick={onClose}
              >
                <CloseIcon />
              </IconButton>

              <Typography variant="h5" sx={{ mb: 3, paddingTop: '10px' }}>
                Details
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <button onClick={() => setVideoSrc(getCloudFrontUrl(video.assessmentDetails.s3OverlayUrl))} className="relative">
                <img
                  src={video.thumbnailUrl || 'path_to_thumbnail_image_or_placeholder'}
                  alt={player.name}
                  style={{ width: 91, height: 50, objectFit: 'cover', borderRadius: 8 }}
                />
                <div
                  style={{
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={'/assets/play.svg'}
                    alt="Play button"
                    style={{ width: 23, height: 23, objectFit: 'cover' }}
                  />
                </div>
              </button>

              <Box sx={{ ml: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {player.name || 'Micheal Phillips'}
                </Typography>
                <Typography variant="body1" sx={{ color: "#00FF00" }}>
                  {`${convertDoBToAge(player.roleData.dob) || ''} ${(player.roleData.dob && (player.city || player.country) && '|') || ''} ${`${player.city || ''}${player.city && player.country ? ',' : ''} ${player.country || ''}`.trim() || ""}`.trim()}
                </Typography>
              </Box>
            </Box>

            {/* Divider added here */}
            <Divider sx={{ mb: 2, backgroundColor: '#232835' }} />

            {/* Player Stats with Progress Bars */}
            <Grid container gap={2} padding={2} sx={{ backgroundColor: "#ffffff0d" }} justifyContent={'space-between'}>
              <Grid item container gap={2}>
                <Grid item container gap={1} xs justifyContent={'space-evenly'}>
                  <Grid item container flexDirection={'column'} xs>
                    <Typography className="!text-sm !font-bold">Arm Speed</Typography>
                    <Typography className="!text-sm">{metrics.hand_speed} mph</Typography>
                  </Grid>
                  <Grid item container flexDirection={'column'} xs>
                    <Typography className="!text-sm !font-bold">Release Time</Typography>
                    <Typography className="!text-sm">{metrics.release_time} msec</Typography>
                  </Grid>
                </Grid>
                <Grid item container flexDirection={'column'} xs>
                  <Typography className="!text-sm !font-bold">Overall Throw Score</Typography>
                  <CustomLinearProgress value={metrics.overall_score} color="#FF4500" />
                </Grid>
              </Grid>
              <Grid item container gap={2}>
                <Grid item container flexDirection={'column'} xs>
                  <Typography className="!text-sm !font-bold">Kinematic Sequence Score</Typography>
                  <CustomLinearProgress value={metrics.sequence_score} color="#00FF00" />
                </Grid>
                <Grid item container flexDirection={'column'} xs>
                  <Typography className="!text-sm !font-bold">Acceleration Score</Typography>
                  <CustomLinearProgress value={metrics.acceleration_score} color="#00BFFF" />
                </Grid>
              </Grid>
              <Grid item container gap={2}>
                <Grid item container flexDirection={'column'} xs>
                  <Typography className="!text-sm !font-bold">Deceleration Score</Typography>
                  <CustomLinearProgress value={metrics.deceleration_score} color="#8A2BE2" />
                </Grid>
                <Grid item container flexDirection={'column'} xs>
                  <Typography className="!text-sm !font-bold">Velocity Efficiency Score</Typography>
                  <CustomLinearProgress value={metrics.efficiency_score} color="#FF4500" />
                </Grid>
              </Grid>
            </Grid>
          </div>}
        <VideoPlayer open={videoSrc ? true : false} onClose={() => setVideoSrc('')} src={videoSrc} />
      </Box>
    </Modal>
  );
};

export default PlayerVideoDetailsModal;
