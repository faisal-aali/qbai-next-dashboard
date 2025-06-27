// src/components/History/History.js
"use client";
import { Fragment, useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import { useSession } from "next-auth/react";
import axios from 'axios';
import Pagination from "../../../Common/Pagination/Pagination";
import VideoPlayer from "../../../Common/VideoPlayer/VideoPlayer";
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import DeleteVideoModal from "../DeleteVideoModal/DeleteVideoModal";
import RequestDeleteModal from './modal/RequestVideoDeleteModal'; // Adjust the import path accordingly
import { useApp } from "@/components/Context/AppContext";
import { getCloudFrontUrl } from "@/util/utils";


const CustomLinearProgress = ({ value, color }) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="body2">
        {`${Math.round(value)}%`}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 3,
          borderRadius: 0,
          backgroundColor: "#E0E0E0",
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
          },
        }}
      />
    </Box>
  );
};

const History = (props) => {
  const user = useSession().data?.user || {}
  const { showSnackbar } = useApp();

  const [videoSrc, setVideoSrc] = useState('')

  const [data, setData] = useState()
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [requests, setRequests] = useState([])

  const [showDetails, setShowDetails] = useState();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [showRequestDeleteModal, setShowRequestDeleteModal] = useState(false);

  const rowsPerPage = 10;

  useEffect(() => {
    console.log("History mounted");
    fetchVideos();
  }, [page]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const fetchVideos = () => {
    setLoading(true);
    axios
      .get("/api/v2/videos", {
        params: {
          userId: props.playerId || user._id,
          trainerId: props.trainerId,
          page,
          limit: rowsPerPage,
        },
      })
      .then((res) => {
        setData(res.data.videos);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchRequests = () => {
    axios.get('/api/requests').then(res => {
      setRequests(res.data)
    }).catch(console.error)
  }

  const handleDeleteClick = (videoId) => {
    setSelectedVideoId(videoId);
    setShowDeleteModal(true);
  };

  const handleRequestDelete = (videoId) => {
    setSelectedVideoId(videoId);
    setShowRequestDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false); // Close the modal
  };

  const requestVideoDeletion = async (reason) => {
    try {
      await axios.post('/api/requests/videoDeletion', { reason, videoId: selectedVideoId })
      showSnackbar('Your request has been submitted', 'success');
      fetchRequests()
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    }
  }

  // TODO: fix status always showing as pending
  // TODO: overlay video not showing initially

  return (
    <>
      <div className="flex-1">
        <div className={`blueBackground p-4 primary-border rounded-lg flex items-center justify-between mb-4 h-32 w-full xl:w-3/5 ${props.omitHeader && 'hidden'}`}>
          <div className="flex gap-5 items-center">
            <div className="ml-4">
              <h2 className="text-lg md:text-4xl font-normal">
                Here's your <span className="text-primary font-semibold">History</span>
              </h2>
              <p className="text-white text-sm">
                You can view and download the report
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col   gap-4">
          <div>
            <TableContainer component={Paper} className="!bg-transparent">
              <Table>
                <TableHead className="leaderboard-table-head bg-primary-light uppercase">
                  <TableRow>
                    <TableCell className="!text-white">Videos</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }} className="!text-white">Date</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }} className="!text-white">Status</TableCell>
                      <TableCell className="!text-white">Overall Throw Score</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }} className="!text-white">Reports</TableCell>
                      <TableCell className="!text-white" sx={{ display: { xs: 'table-cell', sm: 'table-cell', md: 'none' } }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className="leaderboard-table-body">
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ border: "none" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            py: 4,
                          }}
                        >
                          <CircularProgress />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.map((row, index) => {
                      const qbRating =
                        row.assessmentDetails?.stats?.metrics?.overall_score;
                      const fileUrl = getCloudFrontUrl(
                        row.assessmentDetails?.s3FileUrl
                      );
                      const pdfUrl = getCloudFrontUrl(
                        row.assessmentDetails?.s3PdfUrl
                      );
                      const overlayUrl = getCloudFrontUrl(
                        row.assessmentDetails?.s3OverlayUrl
                      );

                      return (
                        <Fragment key={index}>
                          <TableRow>
                            <TableCell className="!text-white min-w-28 md:min-w-40">
                              <button onClick={() => setVideoSrc(fileUrl)} className="relative">
                                <img
                                  src={row.thumbnailUrl}
                                  alt={row.name}
                                  style={{ width: 75, height: 50, objectFit: 'cover', borderRadius: 8 }}
                                />
                                <div className="top-0 left-0 w-full h-full absolute flex justify-center items-center">
                                  <img
                                    src={'/assets/play.svg'}
                                    alt={row.name}
                                    style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 8 }}
                                  />
                                </div>
                              </button>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }}>
                              {/* <Typography variant="body2" className="!text-white">
                              Delivery in
                            </Typography> */}
                              <Typography variant="caption" className="!text-white">
                                {new Date(row.creationDate).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }} className="!text-white">
                              {row.assessmentDetails?.statusCode === "InProgress" ? "In Progress" : row.assessmentDetails?.statusCode || 'Pending'}
                            </TableCell>
                            <TableCell className="!text-white min-w-40 md:min-w-60 ">
                              {qbRating &&
                                <CustomLinearProgress
                                  value={qbRating}
                                  color="#00FF00"
                                />}
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }} className="text-white min-w-96">
                              <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-4">
                                <button disabled={!pdfUrl?.startsWith('http')} onClick={() => window.open(pdfUrl)} className={`bg-white flex justify-center items-center gap-2 text-black px-0 md:px-5 py-2 md:py-3 rounded-lg ${!pdfUrl && 'hidden'}`}>
                                  <DownloadIcon />
                                  DOWNLOAD PDF
                                </button>
                                <button onClick={() => setVideoSrc(overlayUrl)} className={`bg-white flex justify-center items-center gap-2 text-black px-0 md:px-5 py-2 md:py-3 rounded-lg ${!overlayUrl && 'hidden'}`}>
                                  <PlayArrowIcon />
                                  OVERLAY VIDEO
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(row._id)}
                                  className={`button-danger flex justify-center items-center w-8 h-8 rounded p-2 focus:outline-none ${user?.role !== "admin" && "hidden"}`}
                                >
                                  <img src="/assets/delete-icon-white.svg" alt="" />
                                </button>
                                <button
                                  disabled={requests.find(r => r.entityId === row._id) ? true : false}
                                  onClick={() => handleRequestDelete(row._id)} className={`bg-white flex justify-center items-center gap-2 text-black px-0 md:px-5 py-2 md:py-3 rounded-lg ${user?.role !== "player" && user?.role !== "trainer" && "hidden"} ${!overlayUrl && 'hidden'}`}
                                  style={{
                                    color: requests.find(r => r.entityId === row._id) ? '#FA9C02' : 'red',
                                  }}
                                >

                                  {requests.find(r => r.entityId === row._id) ? "REQUESTED" : "REQUEST DELETE"}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'table-cell', sm: 'table-cell', md: 'none' } }} className="!text-white">
                              <IconButton onClick={() => setShowDetails(v => v === index ? null : index)}>
                                {index === showDetails ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow sx={{ display: showDetails === index ? { xs: 'table-row', sm: 'table-row', md: 'none' } : 'none' }}>
                            <TableCell colSpan={3} sx={{ padding: 0 }}>
                              <Grid container gap={2} padding={2} className="blueBackground" justifyContent={'space-between'} flexDirection={'column'}>
                                <Grid item container gap={1} justifyContent={'space-evenly'}>
                                  <Grid item container flexDirection={'column'} xs>
                                    <Grid item>
                                      <Typography className="!text-sm !font-bold">Date</Typography>
                                    </Grid>
                                    <Grid item>
                                      <Typography className="!text-sm">{new Date(row.creationDate).toLocaleDateString()}</Typography>
                                    </Grid>
                                  </Grid>
                                  <Grid item container flexDirection={'column'} xs>
                                    <Grid item>
                                      <Typography className="!text-sm !font-bold">Status</Typography>
                                    </Grid>
                                    <Grid item>
                                      <Typography className="!text-sm">{row.assessmentDetails?.statusCode === "InProgress" ? "In Progress" : row.assessmentDetails?.statusCode || 'Pending'}</Typography>
                                    </Grid>
                                  </Grid>
                                </Grid>
                                <Grid item container gap={1} justifyContent={'space-evenly'}>
                                  <Grid item flexDirection={'column'} xs>
                                    <button onClick={() => window.open(pdfUrl)} className={`bg-white w-full flex justify-center items-center gap-2 text-black !text-xs px-0 md:px-5 py-2 md:py-3 rounded-lg ${!pdfUrl && 'hidden'}`}>
                                      <DownloadIcon />
                                      DOWNLOAD PDF
                                    </button>
                                  </Grid>
                                  <Grid item flexDirection={'column'} xs>
                                    <button onClick={() => setVideoSrc(overlayUrl)} className={`bg-white w-full flex justify-center items-center gap-2 text-black !text-xs px-0 md:px-5 py-2 md:py-3 rounded-lg ${!overlayUrl && 'hidden'}`}>
                                      <PlayArrowIcon />
                                      OVERLAY VIDEO
                                    </button>
                                  </Grid>
                                </Grid>
                              </Grid>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          <div className="mt-4">
            <Pagination
              page={page}
              count={totalPages}
              onChange={handlePageChange}
            />
          </div>
        </div>

        <DeleteVideoModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          videoId={selectedVideoId}
          onSuccess={fetchVideos}
        />

        <RequestDeleteModal
          open={showRequestDeleteModal}
          onClose={() => setShowRequestDeleteModal(false)}
          onConfirm={requestVideoDeletion}
        />
        <VideoPlayer open={videoSrc ? true : false} onClose={() => setVideoSrc('')} src={videoSrc} />
      </div>
    </>
  );
};

export default History;
