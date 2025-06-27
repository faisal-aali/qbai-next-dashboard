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
  firstName: Yup.string().required("Required"),
  lastName: Yup.string().required("Required"),
  heightFt: Yup.number().optional(),
  heightIn: Yup.number().max(11).optional(),
  handedness: Yup.string().oneOf(['left', 'right'], 'Handedness must be a valid string').optional(),
  weight: Yup.string().optional(),
  // plan: Yup.string().required("Required"),
  // role: Yup.string().required("Required"),
});

const passwordValidationSchema = Yup.object({
  newPassword: Yup.string().required("Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
    .required("Required"),
});

const UpdatePasswordModal = ({ open, onClose, userId }) => {

  const [response, setResponse] = useState({})
  const { showSnackbar } = useApp();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = (values) => {
    return new Promise((resolve, reject) => {
      axios.patch("/api/users/updatePassword/admin", {
        id: userId,
        password: values.newPassword,
      }).then(res => {
        showSnackbar('Password Updated!', 'success');
        resolve()
      }).catch(err => {
        showSnackbar(err.response?.data?.message || err.message, 'error');
        reject(err)
      })
    })
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
      <Box sx={style} className="blueBackground px-16 w-full max-w-2xl">
        <IconButton
          style={{ position: "absolute", top: 10, right: 10, color: '#fff' }}
          onClick={onClose}
        ></IconButton>
        <h2 className="text-2xl font-bold mb-8 text-center flex flex-col">
          Update Password
        </h2>
        <Formik
          initialValues={{
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={passwordValidationSchema}
          onSubmit={(values, { resetForm }) => {
            handleChangePassword(values).then(() => resetForm()).catch(console.error)
          }}
        >
          {({ errors, touched, values }) => (
            <Form>
              <div className="flex flex-col items-center p-4 mt-8">
                <div className="flex items-center flex-col md:flex-row w-full mb-4 gap-6">
                  <div className="w-full md:w-1/2">
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">New Password</label>
                    </div>
                    <div className="relative">
                      <Field
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.newPassword && touched.newPassword
                          ? "border-red-900 border"
                          : "primary-border focus:border-green-500"
                          }`}
                        placeholder="Enter new password"
                      />
                      <div
                        className="absolute inset right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">Confirm Password</label>
                    </div>
                    <div className="relative">
                      <Field
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.confirmPassword && touched.confirmPassword
                          ? "border-red-900 border"
                          : "primary-border focus:border-green-500"
                          }`}
                        placeholder="Confirm"
                      />
                      <div
                        className="absolute inset right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </div>
                    </div>
                  </div>
                </div>
                {response.message && <div className={`flex justify-end col-span-2 ${response.severity === 'success' ? 'text-primary' : 'text-error'}`}>{response.message}</div>}
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    disabled={!values.newPassword || !values.confirmPassword}
                    type="submit"
                    className="bg-primary dark-blue-color px-4 py-1 rounded font-bold uppercase text-sm hover-button-shadow"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  )
}

const EditUserModal = ({ open, onClose, userData, onSuccess }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [user, setUser] = useState(userData)
  const [response, setResponse] = useState({})
  const { showSnackbar } = useApp();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);


  const fetchUser = () => {
    return new Promise((resolve) => {
      axios.get('/api/users', { params: { id: userData._id } }).then(res => {
        console.log('fetchuser', res.data[0])
        setUser(res.data[0])
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
    } else {
      showSnackbar("Please drop a valid image file.", "error");
    }
  };
  const handleSubmit = async (values) => {
    try {
      let imageUrl = user.avatarUrl;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post("/api/S3", formData);
        imageUrl = res.data.url;
      }

      const data = {
        email: values.email,
        name: `${values.firstName} ${values.lastName}`,
        city: values.city,
        country: values.country,
        height: convertFeetAndInchesToCm(values.heightFt, values.heightIn),
        weight: values.weight,
        handedness: values.handedness,
        avatarUrl: imageUrl,
      };

      await axios.post(
        `/api/${(userData.role === "player" && "players") ||
        (userData.role === "trainer" && "trainers") ||
        (userData.role === "staff" && "staff") ||
        (userData.role === "admin" && "admin")
        }/${userData._id}`,
        data
      );

      showSnackbar(`${userData.role} has been updated`, "success");
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
        <h2 className="text-2xl font-bold mb-8 text-center flex flex-col">
          Edit Details
        </h2>
        <Formik
          enableReinitialize
          initialValues={{
            firstName: user.name.split(' ')[0] || "",
            lastName: user.name.split(' ')[1] || "",
            heightFt: convertCmToFeetAndInches(user.roleData?.height).feet,
            heightIn: convertCmToFeetAndInches(user.roleData?.height).inches,
            weight: user.roleData?.weight || "",
            handedness: user.roleData?.handedness || "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            handleSubmit(values).then(() => {
              onSuccess && onSuccess();
              fetchUser().finally(() => resetForm())
            }).catch(console.error)
          }}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="grid col-span-2 gap-2">
                  <div className="opacity-45">
                    <label htmlFor="">Profile Photo</label>
                  </div>
                  <div className="grid grid-cols-1 gap-4"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                  >
                    <div className={`flex items-center justify-center flex-col blueBackground rounded-lg w-full py-4 gap-4 border-dashed border-2 ${isDragging ? "border-green-500" : "border-slate-800"
                      }`}>
                      <div className="w-24">
                        <img
                          src={
                            file
                              ? URL.createObjectURL(file)
                              : user.avatarUrl || "/assets/samples/150.png"
                          }
                          alt="Preview"
                          className="object-cover object-top
                              rounded-full w-[100px] h-[100px]"
                        />
                      </div>
                      <label className="cursor-pointer flex items-center justify-center">
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                          setFieldValue('profilePhoto', event.currentTarget.files[0]);
                          setFile(event.currentTarget.files[0]);
                        }} />
                        <img src="/assets/upload-icon.svg" alt="" />
                      </label>
                      <div className="text-center">
                        <span className="text-primary text-2xl">Click to Upload image</span>
                        <span className="text-white mx-2 text-2xl">or drag and drop</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="">First Name</label>
                  </div>
                  <Field
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                    ${errors.firstName && touched.firstName
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                      }`}
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
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                    ${errors.lastName && touched.lastName
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                      }`}
                    type="text"
                    name="lastName"
                    required
                  />
                </div>
                {userData.role === 'player' &&
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
                  </div>}
                {userData.role === 'player' &&
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
                  </div>}
                {userData.role === 'player' &&
                  <div className={`col-span-2 md:col-span-1 grid gap-2`}>
                    <div className="opacity-45">
                      <label htmlFor="">Handedness</label>
                    </div>
                    <TextField variant="outlined" select fullWidth value={values.handedness} InputProps={{ style: { height: 50 } }} onChange={(e) => setFieldValue('handedness', e.target.value)}>
                      <MenuItem value={'left'}>Left</MenuItem>
                      <MenuItem value={'right'}>Right</MenuItem>
                    </TextField>
                  </div>}
              </div>
              {response.message && <div className={`flex justify-end col-span-2 mb-4 ${response.severity === 'success' ? 'text-primary' : 'text-error'}`}>{response.message}</div>}
              <div className="flex flex-col-reverse md:flex-row justify-end mb-10 gap-4">
                <button type="button" onClick={() => setShowPasswordModal(true)} className="bg-primary dark-blue-color uppercase rounded px-6 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow">
                  Update Password
                </button>
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
        <UpdatePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} userId={userData._id} />
      </Box>
    </Modal>
  );
};

export default EditUserModal;
