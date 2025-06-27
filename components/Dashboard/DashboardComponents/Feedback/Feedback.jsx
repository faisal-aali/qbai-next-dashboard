"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Pagination from "../../../Common/Pagination/Pagination";
import axios from 'axios'
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Button, DialogContent, Dialog, useTheme, Badge } from "@mui/material";
import { useApp } from "@/components/Context/AppContext";
import AddTicketModal from '../AddTicketModal/AddTicketModal';
import ViewTicketModal from '../ViewTicketModal/ViewTicketModal';
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import Popper from "@mui/material/Popper";

const StatusChip = ({ status, size = 'large', onClick, arrowDirection, showLoading }) => {
  const { user } = useApp();

  const showPopper = useMemo(() => status === 'open' && user?.role === 'admin', [status, user])

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: showPopper && 'pointer',
        display: 'flex',
        alignItems: 'center',
        paddingY: size === 'large' ? '5px' : '2px',
        justifyContent: 'center', bgcolor: status === 'closed' ? 'rgba(50, 225, 0, 1)' : 'rgba(52, 64, 84, 1)', width: size === 'large' ? 110 : 80, borderRadius: '5px'
      }}>
      <Typography color={status === 'closed' ? 'rgba(9, 15, 33, 1)' : 'white'} sx={{ display: 'flex', alignItems: 'center', textTransform: 'uppercase', fontSize: size === 'large' ? 16 : 12, lineHeight: size === 'large' ? '18px' : '15px', marginTop: '3px' }}>
        {status}
      </Typography>
      {!showPopper ? undefined :
        showLoading ? <CircularProgress size={size === 'large' ? 18 : 12} sx={{ marginLeft: 1 }} color="primary" /> :
          arrowDirection === 'down' ? <KeyboardArrowDown sx={{ color: 'white' }} /> : <KeyboardArrowUp sx={{ color: 'white' }} />}
    </Box >
  )
}

const ConfirmCloseTicket = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
        <Typography fontSize={18}>Do you really want to close this ticket. Once closed the ticket cannot be opened again.</Typography>
        <Box display={'flex'} gap={2}>
          <Button onClick={onClose} variant="contained" sx={{ bgcolor: 'white', ":hover": { bgcolor: 'white' }, color: 'rgba(9, 15, 33, 1)', borderRadius: 2 }}>Cancel</Button>
          <Button onClick={onConfirm} variant="contained" color="primary" sx={{ borderRadius: 2 }}>Confirm</Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

const Feedback = () => {

  const { user, unreadTickets } = useApp();
  const theme = useTheme();

  const [tickets, setTickets] = useState()
  const [showDetails, setShowDetails] = useState()
  const [searchQuery, setSearchQuery] = useState()
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewTicket, setViewTicket] = useState()

  const [closeTicket, setCloseTicket] = useState({
    el: null,
    id: null,
    size: 'large'
  });
  const [closingTicket, setClosingTicket] = useState()
  const [confirmCloseTicket, setConfirmCloseTicket] = useState()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    axios.get('/api/tickets').then(res => {
      setTickets(res.data.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()).map((o, i) => ({ serial: i + 1, ...o })))
    }).catch(console.error)
  }

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const filteredTickets = tickets?.filter(t => t.ticketId.match(searchQuery) || t.user.name.toLowerCase().match(searchQuery.toLowerCase()))

  const paginatedData = filteredTickets?.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const clearCloseTicket = () => {
    setCloseTicket(() => {
      const newState = {
        el: null,
        id: null,
        size: 'large'
      }
      return newState
    })
  }

  const handleCloseTicket = (ticketId) => {
    setClosingTicket(ticketId)
    if (!ticketId) return console.error('[handleCloseTicket] Ticket ID is required')
    axios.patch('/api/tickets/close', { _id: ticketId })
      .then(() => fetchData())
      .catch(console.error)
      .finally(() => setClosingTicket())
  }

  const getUnreadMessagesCount = (ticketId) => {
    return unreadTickets.unreadTickets.find(t => t._id === ticketId)?.unreadMessageIds?.length || 0
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-8 flex-1">
        <div className="blueBackground p-4 primary-border rounded-lg flex items-center justify-between h-32 w-full xl:mt-0 xl:w-3/5">
          <div className="flex gap-5 items-center">
            <div className="ml-4">
              <h2 className="text-2xl md:text-4xl font-normal">Support & Feedback</h2>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse md:flex-row w-full justify-between gap-[30px]">
          <div className="flex search-bar w-full md:w-[400px] 4xl:w-[580px] ">
            <input
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full py-1 rounded-lg text-white h-12 search-background focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className={`flex justify-center ${user?.role === "admin" && "hidden"}`}>
            <button
              className="bg-primary dark-blue-color rounded w-44 h-10 md:h-14 flex items-center justify-center text-lg rounded-lg"
              onClick={() => setShowAddModal(true)}
            >
              CREATE TICKET
            </button>
          </div>
        </div>
        {!filteredTickets ? <CircularProgress /> :
          filteredTickets.length === 0 ? <Typography>No tickets to show</Typography> :
            <div className="flex flex-col rounded-lg">
              <TableContainer component={Paper} className="!bg-transparent">
                <Table>
                  <TableHead className="leaderboard-table-head bg-primary-light uppercase">
                    <TableRow>
                      {/* <TableCell className="!text-white"></TableCell> */}
                      <TableCell className="!text-white">#</TableCell>
                      <TableCell className="!text-white">Ticket ID</TableCell>
                      <TableCell className="!text-white" sx={{ display: user?.role === 'admin' ? { xs: 'none', sm: 'none', md: 'table-cell' } : 'none' }}>User</TableCell>
                      <TableCell className="!text-white" sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }}>Creation Date</TableCell>
                      <TableCell className="!text-white" sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }}>Status</TableCell>
                      <TableCell className="!text-white" sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }}>Ticket Details</TableCell>
                      <TableCell className="!text-white" sx={{ display: { xs: 'table-cell', sm: 'table-cell', md: 'none' } }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="leaderboard-table-body">
                    {paginatedData.map((row, index) => (
                      <Fragment key={index}>
                        <TableRow>
                          {/* <TableCell className="!text-white w-4"><Circle color="primary" sx={{ fontSize: 8, display: user?.role === 'admin' && !row.viewedBy.includes(user?._id) ? 'flex' : 'none' }} /></TableCell> */}
                          <TableCell className="!text-white">{row.serial}</TableCell>
                          <TableCell className="!text-white">{row.ticketId}</TableCell>
                          <TableCell sx={{ display: user?.role === 'admin' ? { xs: 'none', sm: 'none', md: 'table-cell' } : 'none' }} className="!text-white" >
                            {row.user.name}
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }} className="!text-white" >
                            {new Date(row.creationDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }} className="!text-white">
                            <StatusChip status={row.status} arrowDirection={closeTicket?.id === row._id ? 'up' : 'down'} showLoading={closingTicket === row._id} onClick={e => {
                              if (closeTicket?.id === row._id) {
                                clearCloseTicket()
                              } else {
                                setCloseTicket({
                                  el: e.currentTarget,
                                  size: 'large',
                                  id: row._id
                                })
                              }
                            }} />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'none', md: 'table-cell' } }} className="!text-white">
                            <Badge badgeContent={getUnreadMessagesCount(row._id)} color="error">
                              <Button onClick={() => setViewTicket(row)} variant="contained" sx={{ bgcolor: 'white', color: 'rgba(9, 15, 33, 1)' }}>VIEW DETAILS</Button>
                            </Badge>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'table-cell', sm: 'table-cell', md: 'none' } }} className="!text-white">
                            <IconButton onClick={() => setShowDetails(v => v === index ? null : index)}>
                              {index === showDetails ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ display: showDetails === index ? { xs: 'table-row', sm: 'table-row', md: 'none' } : 'none' }}>
                          <TableCell colSpan={4} sx={{ padding: 0 }}>
                            <Grid container flexDirection={'row'} spacing={1} padding={2} className="blueBackground" justifyContent={'space-between'}>
                              {/* <Grid item container gap={1} xs justifyContent={'space-evenly'}> */}
                              <Grid item container flexDirection={'column'} display={user?.role === 'admin' ? 'flex' : 'none'} xs={6}>
                                <Grid item>
                                  <Typography sx={{ fontSize: 10 }}>User</Typography>
                                </Grid>
                                <Grid item>
                                  <Typography sx={{ fontSize: 14 }}>{row.user.name}</Typography>
                                </Grid>
                              </Grid>
                              <Grid item container flexDirection={'column'} xs={6}>
                                <Grid item>
                                  <Typography sx={{ fontSize: 10 }}>Creation Date</Typography>
                                </Grid>
                                <Grid item>
                                  <Typography sx={{ fontSize: 14 }}>{new Date(row.creationDate).toLocaleDateString()}</Typography>
                                </Grid>
                              </Grid>
                              <Grid item container flexDirection={'column'} xs={6}>
                                <Grid item>
                                  <Typography sx={{ fontSize: 10 }}>Status</Typography>
                                </Grid>
                                <Grid item>
                                  <StatusChip status={row.status} size='small' arrowDirection={closeTicket?.id === row._id ? 'up' : 'down'} showLoading={closingTicket === row._id} onClick={(e) => {
                                    if (closeTicket?.id === row._id) {
                                      clearCloseTicket()
                                    } else {
                                      setCloseTicket({
                                        el: e.currentTarget,
                                        size: 'small',
                                        id: row._id
                                      })
                                    }
                                  }} />
                                </Grid>
                              </Grid>
                              {/* </Grid> */}
                              <Grid item container flexDirection={'column'} xs={6}>
                                <Grid item>
                                  <Typography sx={{ fontSize: 10 }}>Ticket Details</Typography>
                                </Grid>
                                <Grid item>
                                  <Button onClick={() => setViewTicket(row)} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'rgba(9, 15, 33, 1)' }}>VIEW DETAILS</Button>
                                </Grid>
                              </Grid>
                            </Grid>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Pagination
                page={page}
                count={Math.ceil(filteredTickets.length / rowsPerPage)}
                onChange={handlePageChange}
              />
            </div>}
      </div>
      {
        showAddModal && (
          <AddTicketModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={fetchData}
          />
        )
      }
      {
        viewTicket && (
          <ViewTicketModal
            open={viewTicket ? true : false}
            ticket={viewTicket}
            onClose={() => setViewTicket()}
            onUpdate={fetchData}
          />
        )
      }
      <Popper open={closeTicket.el ? true : false} anchorEl={closeTicket.el} placement="bottom-start">
        {/* {({ TransitionProps }) => (
          <Slide {...TransitionProps}> */}
        <Box onClick={() => setConfirmCloseTicket(true)} justifyContent={'center'} boxShadow={4} display={'flex'} sx={{ cursor: 'pointer', bgcolor: theme.palette.primary.main, padding: 1, borderRadius: 1, marginTop: 0.5, width: closeTicket.size === 'large' ? 110 : 80 }}>
          <Typography sx={{ color: 'rgba(9, 15, 33, 1)', fontSize: closeTicket.size === 'large' ? 16 : 12, lineHeight: closeTicket.size === 'large' ? '18px' : '15px', }}>CLOSED</Typography>
        </Box>
        {/* </Slide>
        )} */}
      </Popper>
      <ConfirmCloseTicket open={confirmCloseTicket} onClose={() => setConfirmCloseTicket(false)} onConfirm={() => {
        setConfirmCloseTicket(false)
        handleCloseTicket(closeTicket.id)
        clearCloseTicket()
      }} />
    </div >
  );
};

export default Feedback;
