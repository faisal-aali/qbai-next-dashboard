// RequestDeleteModal.js
import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  maxHeight: "90vh",
  overflow: "auto",
};

const RequestDeleteModal = ({ open, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} className="w-full max-w-2xl blueBackground px-16">
        <h2 className="text-white text-lg font-semibold text-center mb-6">Request for Delete</h2>
        <label className="text-white mt-2 opacity-45">Your Reason</label>
        <textarea
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter your reason for deletion..."
          className="w-full h-[240px] p-2 mt-1 text-white opacity-45 dark-blue-background rounded focus:border-green-500"
        />
        <div className="flex justify-between mt-4 gap-4 mt-8">
          <button
            onClick={onClose}
            className="text-white border rounded w-full md:w-80 h-11 flex items-center justify-center text-lg font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="bg-primary dark-blue-color rounded w-full md:w-80 h-11 flex items-center justify-center text-lg font-bold hover-button-shadow"
          >
            Confirm
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default RequestDeleteModal;
