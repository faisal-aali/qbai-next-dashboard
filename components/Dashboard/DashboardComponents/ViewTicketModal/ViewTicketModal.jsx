import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import CloseIcon from "@mui/icons-material/Close";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import axios from 'axios';
import { useApp } from '../../../Context/AppContext';
import { generateYoutubeEmbedUrl } from "@/util/utils";
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { Button, CircularProgress, Grid, styled, Tooltip, Typography } from "@mui/material";
import ImageViewer from '../../../Common/ImageViewer/ImageViewer';
import TicketMessageCard from '../../../Common/TicketMessageCard/TicketMessageCard';
import TicketMessageField from '../../../Common/TicketMessageField/TicketMessageField';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  maxHeight: '90vh',
  overflow: 'auto',
  maxWidth: '95vw',
  width: 600
};

const ViewTicketModal = ({ open, onClose, ticket, onUpdate }) => {
  const { user, showSnackbar, updateUnreadTickets, unreadTickets } = useApp();
  const [comment, setComment] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messages, setMessages] = useState()

  const [newMessage, setNewMessage] = useState('')
  const [newAttachments, setNewAttachments] = useState([])

  const unreadMessageIds = useMemo(() => {
    return unreadTickets.unreadTickets.find(t => t._id === ticket._id)?.unreadMessageIds || []
  }, [unreadTickets, ticket])

  useEffect(() => {
    fetchMessages()
  }, [ticket])

  const unreadTimeout = useRef(null)
  useEffect(() => {
    if (!user) return;

    unreadTimeout.current = setTimeout(() => {
      axios.patch("/api/tickets/viewed", { _id: ticket._id, }).then(() => {
        onUpdate && onUpdate()
        updateUnreadTickets()
      }).catch(console.error)
    }, 2000);

    return () => {
      clearTimeout(unreadTimeout.current)
    }
  }, [user]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const fetchMessages = useCallback(async () => {
    const res = await axios.get(`/api/tickets/messages/${ticket._id}`)
    console.log('setting messages', res.data)
    setMessages(res.data)
  }, [ticket])

  const submitMessage = async () => {
    try {
      setSendingMessage(true)

      if (!newMessage) {
        throw new Error('Please enter a message')
      }

      const attachmentUrls = []

      await Promise.all(
        newAttachments.map(async (attachment) => {
          const formData = new FormData();
          formData.append("file", attachment.file);
          const res = await axios.post("/api/S3", formData);
          const imageUrl = res.data.url;
          attachmentUrls.push(imageUrl)
          return true
        })
      )

      await axios.post("/api/tickets/messages/" + ticket._id, {
        message: newMessage,
        attachments: attachmentUrls
      })
      showSnackbar('Message sent', 'success');
      setNewMessage('')
      setNewAttachments([])
      fetchMessages()
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    } finally {
      setSendingMessage(false)
    }
  }

  // const closeTicket = async () => {
  //   try {
  //     setClosing(true)
  //     await axios.patch("/api/tickets/close", {
  //       _id: ticket._id,
  //       comment
  //     });
  //     showSnackbar('Ticket has been closed', 'success');
  //     onUpdate && onUpdate()
  //     onClose();
  //   } catch (err) {
  //     showSnackbar(err.response?.data?.message || err.message, 'error');
  //   } finally {
  //     setClosing(false)
  //   }
  // }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
      <Box sx={style} className="w-full max-w-3xl blueBackground px-16">
        <Grid container flexDirection={'column'} gap={3} flex={1}>
          <Grid item container justifyContent={'space-between'}>
            <Grid item>
              <Typography fontWeight={'bold'} fontSize={24}>
                Ticket Details
              </Typography>
            </Grid>
            <Grid item>
              <IconButton
                style={{ color: '#fff', border: '1px solid rgba(50, 225, 0, 1)' }}
                onClick={onClose}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Grid item container gap={1.5} maxHeight={'40vh'} overflow={'auto'} ref={el => el && el.scrollTo(0, el.scrollHeight)}>
            {!messages ? <CircularProgress size={20} /> :
              messages.map((message, i) => (
                <TicketMessageCard key={i} message={message} ticket={ticket} unreadMessageIds={unreadMessageIds} />
              ))}
          </Grid>
          {/* <Grid item container display={ticket.status === 'closed' ? 'flex' : 'none'} flexDirection={'column'} gap={1} bgcolor={'rgba(52, 64, 84, 0.7)'} borderRadius={3} padding={2} border={'1px solid rgba(52, 64, 84, 0.7)'}>
            <Grid item container justifyContent={'space-between'}>
              <Grid item>
                <Typography color={'primary'} fontSize={16}>
                  Admin
                </Typography>
              </Grid>
              <Grid item>
                <Typography color={'rgba(137, 147, 158, 1)'} fontSize={14}>
                  {new Date(ticket.closingDate).toLocaleString('en-US')}
                </Typography>
              </Grid>
            </Grid>
            <Grid item>
              <Typography fontSize={14}>
                {ticket.comment}
              </Typography>
            </Grid>
          </Grid> */}
          {/* <Grid item display={ticket.status === 'open' && user?.role === 'admin' ? 'flex' : 'none'}>
            <TextField value={comment} onChange={e => setComment(e.target.value)} variant="outlined" placeholder="Add comment" inputProps={{ style: { borderRadius: 50 } }} fullWidth InputProps={{ style: { backgroundColor: 'rgba(52, 64, 84, 0.7)', color: 'rgba(137, 147, 158, 1)' } }} />
          </Grid> */}
          <Grid item container gap={1.5} flexDirection={'row'} alignItems={'center'} display={ticket.status === 'closed' ? 'none' : 'flex'}>
            <Grid item xs>
              <TicketMessageField
                placeholder="Send a message"
                message={newMessage}
                setMessage={setNewMessage}
                attachments={newAttachments}
                setAttachments={setNewAttachments}
                minRows={1}
                onSubmit={submitMessage}
                submitting={sendingMessage}
              />
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Modal >
  );
};

export default ViewTicketModal;
