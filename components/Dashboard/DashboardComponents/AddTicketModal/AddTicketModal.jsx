import { useEffect, useRef, useState } from "react";
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
import { Button, CircularProgress, styled, Tooltip } from "@mui/material";
import TicketMessageField from "@/components/Common/TicketMessageField/TicketMessageField";

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

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const validationSchema = Yup.object({
  message: Yup.string().required("Required"),
});


const AddTicketModal = ({ open, onClose, onSuccess }) => {
  const formikRef = useRef();
  const { showSnackbar } = useApp();

  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const createTicket = async () => {
    try {
      setIsSubmitting(true)
      const attachmentUrls = []

      await Promise.all(
        attachments.map(async (attachment) => {
          const formData = new FormData();
          formData.append("file", attachment.file);
          const res = await axios.post("/api/S3", formData);
          const imageUrl = res.data.url;
          attachmentUrls.push(imageUrl)
          return true
        })
      )

      await axios.post("/api/tickets", {
        platform: "web",
        attachments: attachmentUrls,
        message
      });

      showSnackbar('Ticket has been created', 'success');
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
      <Box sx={style} className="w-full max-w-3xl blueBackground px-16">
        <IconButton
          style={{ position: "absolute", top: 25, right: 25, color: '#fff', border: '1px solid rgba(50, 225, 0, 1)' }}
          onClick={onClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
        <h2 className="text-lg md:text-2xl font-bold mb-8 flex flex-col">
          Create New Ticket
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <TicketMessageField
              message={message}
              setMessage={setMessage}
              attachments={attachments}
              setAttachments={setAttachments}
            />
          </div>
          <div className="flex justify-center">
            <Button
              variant="contained"
              type="submit"
              className="bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold"
              disabled={isSubmitting || !message}
              startIcon={isSubmitting && <CircularProgress size={16} color="primary" />}
              onClick={createTicket}
            >
              SUBMIT
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default AddTicketModal;
