import { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import axios from "axios";
import { useApp } from "../../../Context/AppContext";

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

const DeleteUserModal = ({ open, onClose, userId, onSuccess }) => {
  const { showSnackbar } = useApp();

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

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/users/${userId}`);
      if (response.status === 200) {
        showSnackbar("User deleted successfully!", "success");
        onSuccess && onSuccess();
      } else {
        showSnackbar("Failed to delete user.", "error");
      }
    } catch (error) {
      showSnackbar("Failed to delete user.", "error");
    } finally {
      onClose();
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} aria-labelledby="delete-modal-title">
        <Box sx={style} className="w-full max-w-lg blueBackground">
          <div className="flex flex-col justify-center items-center gap-5 py-7">
            <div className="border rounded-lg border-red-600 p-2">
              <img src="/assets/delete-icon.svg" alt="Delete Icon" />
            </div>
            <div>
              <p className="text-lg">
                Are you sure you want to delete this user?
              </p>
            </div>
            <div className="flex flex-row gap-4">
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="bg-white dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold"
                >
                  CANCEL
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleDelete}
                  className="bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default DeleteUserModal;
