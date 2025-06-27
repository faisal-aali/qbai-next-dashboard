import { useEffect, useRef, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import schemaValidators from "../../../../schema-validators";
import axios from "axios";
import { convertFeetAndInchesToCm } from "@/util/utils";
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

const AddUserModal = ({ open, onClose, role, onSuccess }) => {
  const { showSnackbar } = useApp();
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState("");
  const [response, setResponse] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  const timeout = useRef();
  useEffect(() => {
    if (response.message) {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setResponse({}), 3000);
    }
  }, [response]);

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
  }, []);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
      };
      reader.readAsDataURL(selectedFile);
      setFile(selectedFile);
    } else {
      showSnackbar("Please upload a valid image file.", "error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
      };
      reader.readAsDataURL(droppedFile);
      setFile(droppedFile);
    } else {
      showSnackbar("Please drop a valid image file.", "error");
    }
  };

  const handleSubmit = async (values) => {
    try {
      let imageUrl = "";
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
        dob: new Date(values.dob),
        avatarUrl: imageUrl,
      };

      await axios.post(
        `/api/${(role === "player" && "players") ||
        (role === "trainer" && "trainers") ||
        (role === "staff" && "staff") ||
        (role === "admin" && "admin")
        }`,
        data
      );
      showSnackbar("User added successfully!", "success");
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, "error");
      throw err
    }
  };

  const validationSchema = Yup.object({
    firstName: Yup.string().required("Required"),
    lastName: Yup.string().required("Required"),
    email: schemaValidators.user.email,
    heightFt: role === "player" && Yup.number().optional(),
    heightIn: role === "player" && Yup.number().max(11).required("Required"),
    weight: role === "player" && Yup.number().required("Required"),
    handedness: role === "player" && schemaValidators.user.handedness,
    dob: role === "player" && Yup.date().required("Required"),
  });

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
      <Box sx={style} className="w-full max-w-3xl blueBackground px-16">
        <IconButton
          style={{ position: "absolute", top: 10, right: 10, color: "#fff" }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        <h2 className="text-2xl font-bold mb-8 text-center flex flex-col">
          <span>To Add a New <span className="capitalize">{role}</span>, </span>Please enter the details below.
        </h2>
        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            heightFt: "",
            heightIn: "",
            weight: "",
            handedness: "",
            email: "",
            password: "",
            dob: ""
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm, setSubmitting }) => {
            handleSubmit(values)
              .then(() => resetForm())
              .catch(console.error)
              .finally(() => setSubmitting(false));
          }}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="grid col-span-2 gap-2">
                  <div className="opacity-45">
                    <label htmlFor="">Profile Photo</label>
                  </div>
                  <div className="grid grid-cols-1 gap-4 h-auto"
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
                        {imageSrc && (
                          <img
                            src={imageSrc}
                            alt="Preview"
                            className="object-cover object-top
                            rounded-full w-[100px] h-[100px]"
                          />
                        )}
                      </div>
                      <label className="cursor-pointer flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        <img src="/assets/upload-icon.svg" alt="" />
                      </label>
                      <div>
                        <span className="text-primary text-2xl">
                          Click to Upload image
                        </span>
                        <span className="text-white mx-2 text-2xl">
                          or drag and drop
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="">First Name</label>
                  </div>
                  <Field
                    className={`w-full text-primary bg-transparent px-3 rounded-lg py-3 text-white rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
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
                    className={`w-full text-primary bg-transparent px-3 rounded-lg py-3 text-white rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                    ${errors.lastName && touched.lastName
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                      }`}
                    type="text"
                    name="lastName"
                    required
                  />
                </div>
                {role === "player" && (
                  <div
                    className={`grid gap-2 relative ${role !== "player" && "hidden"
                      }`}
                  >
                    <div className="opacity-45">
                      <label htmlFor="">Height</label>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Field
                          name="heightFt"
                          type="number"
                          className={`py-3 px-3 blueBackground rounded-lg w-full text-primary focus:outline-none placeholder:opacity-45 ${errors.heightFt && touched.heightFt
                            ? "border-red-900	border"
                            : "primary-border focus:border-green-500"
                            }`}
                        />
                        <div className="absolute bottom-3 right-4 opacity-50 text-white">
                          ft
                        </div>
                      </div>
                      <div className="relative">
                        <Field
                          name="heightIn"
                          type="number"
                          className={`py-3 px-3 blueBackground rounded-lg  w-full text-primary focus:outline-none placeholder:opacity-45 ${errors.heightIn && touched.heightIn
                            ? "border-red-900	border"
                            : "primary-border focus:border-green-500"
                            }`}
                        />
                        <div className="absolute bottom-3 right-4 opacity-50 text-white">
                          in
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {role === "player" && (
                  <div className={`grid gap-2 relative`}>
                    <div className="opacity-45">
                      <label htmlFor="">Weight</label>
                    </div>
                    <Field
                      className={`w-full text-primary bg-transparent px-3 rounded-lg py-3 text-white rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                    ${errors.weight && touched.weight
                          ? "border-red-900	border"
                          : "primary-border focus:border-green-500"
                        }`}
                      type="number"
                      name="weight"
                      required
                    />
                    <div className="absolute bottom-3 right-4 opacity-50 text-white">
                      lbs
                    </div>
                  </div>
                )}
                {role === "player" && (
                  <div
                    className={`grid gap-2 ${role !== "player" && "hidden"}`}
                  >
                    <div className="opacity-45">
                      <label htmlFor="">Handedness</label>
                    </div>
                    <TextField
                      variant="outlined"
                      select
                      fullWidth
                      value={values.handedness}
                      InputProps={{ style: { height: 50 } }}
                      onChange={(e) =>
                        setFieldValue("handedness", e.target.value)
                      }
                      error={Boolean(errors.handedness && touched.handedness)}
                      helperText={
                        errors.handedness && touched.handedness
                          ? errors.handedness
                          : ""
                      }
                    >
                      <MenuItem value={"left"}>Left</MenuItem>
                      <MenuItem value={"right"}>Right</MenuItem>
                    </TextField>
                  </div>
                )}
                <div className={`grid gap-2`}>
                  <div className="opacity-45">
                    <label htmlFor="">Email</label>
                  </div>
                  <Field
                    className={`w-full text-primary bg-transparent px-3 rounded-lg py-3 text-white rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                    ${errors.email && touched.email
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                      }`}
                    type="text"
                    name="email"
                    required
                  />
                </div>
                {role === 'player' &&
                  <div>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="dob">Date of Birth</label>
                    </div>
                    <Field
                      name="dob"
                      type='date'
                      className={`w-full py-3 px-3 blueBackground rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.dob && touched.dob
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                        }`}
                    />
                  </div>}
              </div>
              {response.message && (
                <div
                  className={`flex justify-end col-span-2 mb-4 ${response.severity === "success"
                    ? "text-primary"
                    : "text-error"
                    }`}
                >
                  {response.message}
                </div>
              )}
              <div className="flex justify-end mb-10">
                <button
                  type="submit"
                  className={`bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "ADD"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

export default AddUserModal;
