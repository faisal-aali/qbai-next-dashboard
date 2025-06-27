// components/EditUserModal.js
import { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { convertCmToFeetAndInches, convertFeetAndInchesToCm } from "@/util/utils";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useApp } from "../../../Context/AppContext";

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
  heightFt: Yup.number().optional(),
  heightIn: Yup.number().max(11).optional(),
  handedness: Yup.string().oneOf(['left', 'right'], 'Handedness must be a valid string').optional(),
  weight: Yup.string().optional()
});

const EditPlayerModal = ({ open, onClose, playerData, onSuccess }) => {
  const [player, setPlayer] = useState(playerData)
  const { showSnackbar } = useApp();

  // TODO: players API is removed, use users API instead
  const fetchUser = () => {
    return new Promise((resolve) => {
      axios.get('/api/players', { params: { id: playerData._id } }).then(res => {
        setPlayer(res.data[0])
        resolve()
      }).catch(console.error)
    })
  }

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

  const handleSubmit = async (values) => {
    try {

      const data = {
        height: convertFeetAndInchesToCm(values.heightFt, values.heightIn),
        weight: values.weight,
        handedness: values.handedness
      };

      await axios.post(`/api/players/${playerData._id}`, data);

      showSnackbar(`Player has been updated`, "success");
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
      <Box sx={style} className="w-full max-w-3xl blueBackground px-16">
        <IconButton
          style={{ position: "absolute", top: 10, right: 10, color: '#fff' }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        <h2 className="text-2xl font-bold text-center flex flex-col">
          Edit Player Details
        </h2>
        <Formik
          enableReinitialize
          initialValues={{
            firstName: player.name.split(' ')[0] || "",
            lastName: player.name.split(' ')[1] || "",
            email: player.email || "",
            heightFt: convertCmToFeetAndInches(player.roleData?.height).feet,
            heightIn: convertCmToFeetAndInches(player.roleData?.height).inches,
            weight: player.roleData?.weight || "",
            handedness: player.roleData?.handedness || "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm, setSubmitting }) => {
            handleSubmit(values).then(() => {
              onSuccess && onSuccess();
              fetchUser().finally(() => resetForm())
            }).catch(console.error).finally(() => setSubmitting(false))
          }}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="">First Name</label>
                  </div>
                  <Field
                    disabled={true}
                    className={`w-full bg-transparent px-3 cursor-not-allowed rounded-lg py-3 light-white-color rounded focus:outline-none focus:border-green-500 placeholder:opacity-45 primary-border focus:border-green-500`}
                    type="text"
                    name="firstName"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="">Last Name</label>
                  </div>
                  <Field
                    disabled={true}
                    className={`w-full bg-transparent px-3 cursor-not-allowed rounded-lg py-3 light-white-color rounded focus:outline-none focus:border-green-500 placeholder:opacity-45 primary-border focus:border-green-500`}
                    type="text"
                    name="lastName"
                    required
                  />
                </div>
                <div className={`grid gap-2 relative`}>
                  <div className="opacity-45">
                    <label htmlFor="">Email</label>
                  </div>
                  <Field
                    disabled={true}
                    className={`w-full bg-transparent px-3 cursor-not-allowed rounded-lg py-3 light-white-color rounded focus:outline-none focus:border-green-500 placeholder:opacity-45 primary-border focus:border-green-500`}
                    type="email"
                    name="email"
                    required
                  />
                </div>
                <div className={`col-span-2 md:col-span-1 grid gap-2`}>
                  <div className="opacity-45">
                    <label htmlFor="">Handedness</label>
                  </div>
                  <TextField variant="outlined" select fullWidth value={values.handedness} InputProps={{ style: { height: 50 } }} onChange={(e) => setFieldValue('handedness', e.target.value)}>
                    <MenuItem value={'left'}>Left</MenuItem>
                    <MenuItem value={'right'}>Right</MenuItem>
                  </TextField>
                </div>
                <div className={`grid gap-2 relative`}>
                  <div className="opacity-45">
                    <label htmlFor="">Height</label>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Field
                        name="heightFt"
                        type='number'
                        className={`py-3 px-3 blueBackground rounded-lg w-full text-primary focus:outline-none placeholder:opacity-45 ${errors.heightFt && touched.heightFt
                          ? "border-red-900	border"
                          : "primary-border focus:border-green-500"
                          }`}
                      />
                      <div className="absolute bottom-3 right-4 opacity-50 text-white">ft</div>
                    </div>
                    <div className="relative">
                      <Field
                        name="heightIn"
                        type='number'
                        className={`py-3 px-3 blueBackground rounded-lg  w-full text-primary focus:outline-none placeholder:opacity-45 ${errors.heightIn && touched.heightIn
                          ? "border-red-900	border"
                          : "primary-border focus:border-green-500"
                          }`}
                      />
                      <div className="absolute bottom-3 right-4 opacity-50 text-white">in</div>
                    </div>
                  </div>
                </div>
                <div className={`grid gap-2 relative`}>
                  <div className="opacity-45">
                    <label htmlFor="">Weight</label>
                  </div>
                  <Field
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                    ${errors.weight && touched.weight
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                      }`}
                    type="number"
                    name="weight"
                    required
                  />
                  <div className="absolute bottom-3 right-4 opacity-50 text-white">lbs</div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className={`bg-primary dark-blue-color rounded w-full md:w-28 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "UPDATE"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

export default EditPlayerModal;
