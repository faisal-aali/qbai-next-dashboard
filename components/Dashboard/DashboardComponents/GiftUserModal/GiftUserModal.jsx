// components/UploadModal.js
import { useEffect } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Field, Form, Formik } from "formik";
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

const validationSchema = Yup.object({
  credits: Yup.number().required("Credits is required"),
});

const GiftUserModal = ({ open, onClose, userId, onSuccess }) => {
  const { showSnackbar } = useApp()

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

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true)
      await axios.post('/api/users/giftCredits', { userId, credits: values.credits })
      setSubmitting(false)
      showSnackbar('Credits have been gifted!', 'success')
      onSuccess && onSuccess()
    } catch (err) {
      setSubmitting(false)
      showSnackbar(`Error occured: ${err.response.data?.message || err.message}`, 'error')
    }
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
      <Box sx={style} className="w-full max-w-lg blueBackground px-16">
        <IconButton
          style={{ position: "absolute", top: 10, right: 10, color: '#fff' }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        <h2 className="text-2xl font-bold mb-8 text-center flex flex-col">
          Gift credits to this user
        </h2>
        <Formik
          initialValues={{
            credits: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="">Credits</label>
                  </div>
                  <Field
                    name="credits"
                    type='number'
                    placeholder='Enter amount'
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45 
                      ${errors.credits && touched.credits
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                      }`}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-center mb-10 mt-6 gap-4">
                <button type="button" className="bg-white dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold" onClick={onClose}>
                  CANCEL
                </button>
                <button disabled={isSubmitting} type="submit" className="bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow">
                  GIFT
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

export default GiftUserModal;
