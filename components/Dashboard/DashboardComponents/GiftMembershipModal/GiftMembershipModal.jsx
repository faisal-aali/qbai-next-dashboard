// components/UploadModal.js
import { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import * as Yup from "yup";
import axios from 'axios'
import { useApp } from "@/components/Context/AppContext";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  maxHeight: '90vh',
  overflow: 'auto'
};

const GiftMembershipModal = ({ open, onClose, userId, onSuccess, type }) => {
  const { showSnackbar } = useApp()

  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      if (type === 'grant')
        await axios.post('/api/users/giftMembership', { userId })
      else if (type === 'cancel')
        await axios.post('/api/users/giftMembership/cancel', { userId })
      setSubmitting(false)
      showSnackbar(type === 'grant' ? 'Basic Membership has been gifted' : 'Basic Membership has been revoked', 'success')
      onSuccess && onSuccess()
    } catch (err) {
      setSubmitting(false)
      showSnackbar(`Error occured: ${err.response.data?.message || err.message}`, 'error')
    }
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
      <Box sx={style} className="w-full max-w-lg blueBackground px-16">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-lg font-bold text-center flex flex-col">
              {type === 'grant' ? 'Are you sure you would like to gift Basic Membership to this user?' :
                type === 'cancel' ? 'Are you sure you would like revoke Basic Membership gift from this user?' : ''}
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <button type="button" className="bg-white dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold" onClick={onClose}>
              CANCEL
            </button>
            <button disabled={submitting} onClick={handleSubmit} className={`${type === 'grant' ? 'bg-primary' : 'bg-danger'} ${type === 'grant' ? 'dark-blue-color' : 'white'} rounded w-28 h-9 flex items-center justify-center text-lg font-bold`}>
              {type === 'grant' ? 'GIFT' : 'REVOKE'}
            </button>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default GiftMembershipModal;
