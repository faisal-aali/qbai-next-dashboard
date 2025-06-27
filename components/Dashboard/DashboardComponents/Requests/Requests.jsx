"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Paper,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useApp } from "@/components/Context/AppContext";
import PlayerVideoDetailsModal from "./modal/PlayerVideoDetailsModal";
import axios from 'axios';

const Requests = () => {
  const { user, showSnackbar } = useApp();

  const [requests, setRequests] = useState()
  const [selectedRequest, setSelectedRequest] = useState();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    if (requests && requests[0]) {
      setSelectedRequest(requests[0])
    }
  }, [requests])

  const fetchRequests = () => {
    axios.get('/api/requests').then(res => {
      setRequests(res.data)
    }).catch(console.error)
  }

  const handleRequestClick = (req) => {
    setSelectedRequest(req);
  };

  const handleShowDetails = () => {
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  const playerDetails = {
    name: "Micheal Phillips",
    location: "Dallas, Texas",
    armSpeed: 7.6,
    releaseTime: 458,
    qbRating: 100,
    kinematicSequence: 100,
    acceleration: 100,
    deceleration: 100,
    velocityEfficiency: 100,
  };
  const handleRequestAction = async (action) => {
    try {
      await axios.patch('/api/requests/' + selectedRequest._id, { action })
      showSnackbar(`Request has been ${action}`, 'success');
      fetchRequests()
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    }
  }

  return (
    !requests ? <CircularProgress /> :
      <div>
        <div className="flex flex-col">
          <div className="blueBackground p-4 primary-border rounded-lg flex items-center justify-between mb-4 h-32 w-full xl:mt-0 xl:w-3/5">
            <div className="flex gap-5 items-center">
              <div className="ml-4">
                <h2 className="text-2xl md:text-4xl font-normal">
                  Hello{" "}
                  <span className="font-semibold capitalize">
                    {user?.name.split(" ")[0]}
                  </span>
                </h2>
              </div>
            </div>
          </div>
          <div className="block md:flex flex-grow gap-4 request-wrapper">
            <Paper className="w-full md:w-2/5 flex-grow !bg-transparent p-4 requested-users">
              <Typography variant="h3" className="text-white text-2xl md:text-5xl">
                Requests
              </Typography>
              {requests.length == 0 ?
                <div className="mt-4"><Typography>No requests to show</Typography></div> :
                <List className="!mt-6 !bg-slate-900 !pt-0">
                  {requests.map((req) => (
                    <ListItemButton
                      className="h-[75px]"
                      key={req._id}
                      onClick={() => handleRequestClick(req)}
                    >
                      <ListItemText
                        primary={
                          <span className="w-full md:flex gap-4">
                            <span className="w-full md:w-1/2">[{req.action}] {req.user.name}</span>
                            <span className="text-gray-400 ml-2 w-full md:w-1/5">{req.user.email}</span>
                          </span>
                        }
                        className="text-white"
                      />
                      {selectedRequest?._id === req._id && (
                        <ChevronRightIcon className="text-white ml-2" />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              }
            </Paper>

            <Paper className={`w-full md:w-3/5 flex-none !bg-transparent p-4 ${!selectedRequest && 'hidden'}`}>
              <div className={`flex items-center justify-between`}>
                <Typography variant="h3" className="text-white text-2xl md:text-5xl">
                  Details
                </Typography>
                <button onClick={handleShowDetails} className="w-44 md:w-60 h-[42px] dark-blue-color bg-white border rounded-lg flex items-center justify-center text-sm md:text-lg">
                  SEE VIDEO & DETAILS
                </button>
              </div>
              {selectedRequest ? (
                <div className="mt-6 text-gray-300">
                  <textarea
                    value={selectedRequest.reason}
                    readOnly
                    className="w-full h-[240px] bg-transparent text-white opacity-45 border rounded-lg p-4 focus:outline-none resize-none"
                    style={{ height: '200px' }}
                  />
                  <div className="mt-4 block md:flex justify-center gap-4">
                    <button disabled={selectedRequest.action !== 'pending'} onClick={() => handleRequestAction('rejected')} className="w-full md:w-72 mb-4 md:mb-0 h-[44px] text-white border rounded flex items-center justify-center text-lg font-bold">
                      Reject Delete Request
                    </button>
                    <button disabled={selectedRequest.action !== 'pending'} onClick={() => handleRequestAction('accepted')} className="w-full md:w-72 h-[44px] bg-primary dark-blue-color rounded flex items-center justify-center text-lg font-bold">
                      Accept Delete Request
                    </button>
                  </div>
                </div>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  Select a request to see details
                </Typography>
              )}
            </Paper>
          </div>
        </div>
        {selectedRequest &&
          <PlayerVideoDetailsModal
            open={showDetails}
            onClose={handleCloseDetails}
            request={selectedRequest}
          />}
      </div>

  );
};

export default Requests;
