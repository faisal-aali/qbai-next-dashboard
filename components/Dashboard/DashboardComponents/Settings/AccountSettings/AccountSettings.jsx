import { useEffect, useRef, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import { getNames } from 'country-list'
import { convertCmToFeetAndInches, convertFeetAndInchesToCm } from "@/util/utils";
import UpdateEmailModal from "../../UpdateEmailModal/UpdateEmailModal";
import { useApp } from "../../../../Context/AppContext";

const AccountSettings = () => {
  const formikRef = useRef()
  // const [user, setUser] = useState(_user)
  const { user, fetchUser } = useApp()
  // const user = useSession().data?.user || {}
  const [response, setResponse] = useState({})
  const countries = getNames()

  const [imageSrc, setImageSrc] = useState();
  const [file, setFile] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUpdateEmailModal, setShowUpdateEmailModal] = useState(false)
  const { showSnackbar } = useApp();
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);



  // const reinitializeForm = (user) => {
  //   Object.keys(user).forEach(field => {
  //     formikRef.current.setFieldValue(field, (user[field] === undefined || user[field] === null ? "" : user[field]))
  //   })
  // }

  const timeout = useRef()
  useEffect(() => {
    if (response.message) {
      clearTimeout(timeout.current)
      timeout.current = setTimeout(() => setResponse({}), 3000);
    }
  }, [response])

  // useEffect(() => {
  //   reinitializeForm({
  //     ...user,
  //     ...user.roleData,
  //     firstName: user.name.split(' ')[0],
  //     lastName: user.name.split(' ')[1] || "",
  //     age: user.roleData.age || '',
  //     heightFt: convertCmToFeetAndInches(user.roleData.height).feet,
  //     heightIn: convertCmToFeetAndInches(user.roleData.height).inches,
  //     handedness: user.roleData.handedness || '',
  //     weight: user.roleData.weight || '',
  //     anonymous: user.roleData.anonymous,
  //   })
  // }, [user])

  // const fetchUser = () => {
  //   console.log('accountsettings fetchuser called')
  //   return new Promise((resolve) => {
  //     axios.get('/api/users', { params: { id: user._id } })
  //       .then(res => {
  //         setUser({
  //           ...res.data[0],
  //           avatarUrl: res.data[0].avatarUrl || ""
  //         });
  //       })
  //       .catch(console.error)
  //       .finally(() => resolve());
  //   });
  // };


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

  // TODO: fix avatar update not working

  const handleSave = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const res = await axios.post("/api/S3", formData);
      const imageUrl = res.data.url;
      await axios.post(`/api/${(user.role === 'player' && 'players') || (user.role === 'trainer' && 'trainers') || (user.role === 'staff' && 'staff') || (user.role === 'admin' && 'admin')}/${user._id}`, { avatarUrl: imageUrl });
      showSnackbar('Profile Picture Updated!', 'success');
      setLoading(false);
      await fetchUser();
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    }
  };

  const handleChangePassword = ({ currentPassword, newPassword }) => {
    console.error('handleChangePassword')
    axios.patch("/api/users/updatePassword", {
      oldPassword: currentPassword,
      newPassword,
    }).then(res => {
      showSnackbar('Password Updated!', 'success');
    }).catch(err => {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    })
  }

  const handleUpdateProfile = (values) => {
    return new Promise((resolve, reject) => {
      values.name = `${values.firstName} ${values.lastName}`.trim();
      values.height = convertFeetAndInchesToCm(values.heightFt, values.heightIn) || null;
      if (values.dob) values.dob = new Date(values.dob);
      const data = {}
      Object.keys(values).forEach(key => {
        data[key] = values[key] || (typeof values[key] === 'boolean' ? values[key] : null)
      })
      console.log(data)
      axios.post(`/api/${(user.role === 'player' && 'players') || (user.role === 'trainer' && 'trainers') || (user.role === 'staff' && 'staff') || (user.role === 'admin' && 'admin')}/${user._id}`, data).then(res => {
        showSnackbar('Changes Saved!', 'success');
        resolve()
      }).catch(err => {
        showSnackbar(err.response?.data?.message || err.message, 'error');
        reject(err)
      })
    })
  }

  const validationSchema = Yup.object({
    firstName: Yup.string().required("Required"),
    lastName: Yup.string().required("Required"),
    // email: Yup.string().email("Invalid email address").required("Required"),
    bio: Yup.string().optional(),
    dob: Yup.date().max(new Date(), 'DoB cannot be in the future').optional(),
    heightFt: Yup.number().optional(),
    heightIn: Yup.number().max(11).optional(),
    handedness: Yup.string().optional(),
    weight: Yup.number().optional(),
    city: Yup.string().optional(),
    state: Yup.string().optional(),
    country: Yup.string().optional(),
    anonymous: Yup.boolean().optional(),
  });

  const passwordValidationSchema = Yup.object({
    currentPassword: Yup.string().required("Required"),
    newPassword: Yup.string().required("Required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Required"),
  });

  return (
    !user ? <CircularProgress /> :
      <div className="rounded-lg bg-dark-blue space-y-8">
        <Formik
          innerRef={formikRef}
          enableReinitialize
          initialValues={{
            firstName: user.name.split(' ')[0],
            lastName: user.name.split(' ')[1] || "",
            // email: user.email,
            bio: user.bio || "",
            city: user.city || "",
            state: user.state || "",
            country: user.country || "",
            dob: (user.roleData?.dob && new Date(user.roleData.dob).toISOString().split('T')[0]) || "2000-12-12",
            heightFt: convertCmToFeetAndInches(user.roleData?.height).feet,
            heightIn: convertCmToFeetAndInches(user.roleData?.height).inches,
            handedness: user.roleData?.handedness || "",
            weight: user.roleData?.weight || "",
            anonymous: user.roleData?.anonymous,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm, setSubmitting }) => {
            setSubmitting(true)
            handleUpdateProfile(values).catch(console.error).finally(() => {
              setSubmitting(false)
              fetchUser(() => resetForm())
            })
          }}
        >
          {({ errors, touched, setFieldValue, values, isSubmitting, resetForm }) => (
            <Form>
              <div className={`flex flex-col md:flex-row space-y-4 primary-border rounded-lg flex items-center p-4`}>
                <div className="basis-2/5 flex pl-6 2xl:pl-20 justify-between flex-col">
                  <div>
                    <h2 className="text-xl font-bold">Profile Photo</h2>
                    <p className="text-gray-400">
                      This image will be displayed on your profile
                    </p>
                  </div>
                </div>
                <div className={`basis-3/5 flex flex-col gap-4 md:gap-4 md:flex-row primary-border rounded-lg p-2 md:p-8 items-center`}>
                  <div className="flex items-center justify-center w-auto">
                    <div className="relative rounded-full overflow-hidden w-[100px] md:w-[150px] h-[100px] md:h-[150px]">
                      <img
                        src={imageSrc || (user.avatarUrl ? user.avatarUrl : "https://placehold.co/100x100")}
                        alt="Profile"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-full">
                    <div className={`p-8 flex items-center justify-center flex-col blueBackground rounded-lg w-full gap-4 border-dashed border-2  ${isDragging ? "border-green-500" : "border-slate-800"}`}
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
                      <label className="cursor-pointer flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        <img src="assets/upload-icon.svg" alt="" />
                      </label>
                      <div className="text-center">
                        <span className="text-primary text-sm 2xl:text-2xl">
                          Click to Upload
                        </span>
                        <span className="text-white mx-2 text-sm 2xl:text-2xl">
                          or drag and drop
                        </span>
                      </div>
                      <p className="text-white text-sm 2xl:text-lg text-center">
                        JPG, PNG, or GIF (Recommended size 1000x1000px)
                      </p>
                    </div>
                    <div className="flex w-full justify-end mt-6 gap-4">
                      <button
                        type="button"
                        className="text-white"
                        onClick={() =>
                          setImageSrc()
                        }
                      >
                        Cancel
                      </button>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <button type="button" className="text-primary pl-2" onClick={handleSave}>
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className={`flex flex-col md:flex-row space-y-4 primary-border rounded-lg flex items-center p-4 mt-8`}>
                <div className="basis-2/5 flex pl-0 md:pl-6 2xl:pl-20 justify-between flex-col">
                  <div>
                    <h2 className="text-xl  font-bold">Personal Information</h2>
                    <p className="text-gray-400">
                      Update your personal details here.
                    </p>
                  </div>
                </div>
                <div className="basis-3/5 grid grid-cols-2 gap-y-2 gap-x-6">
                  <div>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">First Name</label>
                    </div>
                    <div>
                      <Field
                        name="firstName"
                        className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.firstName && touched.firstName
                          ? "border-red-900	border"
                          : "primary-border focus:border-green-500"
                          }`}
                        placeholder="First Name"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">Last Name</label>
                    </div>
                    <div>
                      <Field
                        name="lastName"
                        className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.lastName && touched.lastName
                          ? "border-red-900	border"
                          : "primary-border focus:border-green-500"
                          }`}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">Bio</label>
                    </div>
                    <Field
                      name="bio"
                      as="textarea"
                      className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.bio && touched.bio
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                        }`}
                      placeholder="Enter your bio"
                    />
                  </div>
                  {/* <div>
                  <div className="mb-1 opacity-45">
                    <label htmlFor="">Email</label>
                  </div>
                  <Field
                    name="email"
                    readOnly={true}
                    type="email"
                    className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.email && touched.email
                      ? "border-red-900	border"
                      : "primary-border focus:border-green-500"
                      }`}
                    placeholder="Email"
                  />
                </div> */}
                  <div>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">City</label>
                    </div>
                    <Field
                      name="city"
                      className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.city && touched.city
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                        }`}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">State</label>
                    </div>
                    <Field
                      name="state"
                      className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.state && touched.state
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                        }`}
                      placeholder="state"
                    />
                  </div>
                  <div>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">Country</label>
                    </div>
                    <TextField variant="outlined" select value={values.country} fullWidth InputProps={{ sx: { height: '50px' } }} onChange={(e) => setFieldValue('country', e.target.value)}>
                      {/* <MenuItem value={''} disabled>Select</MenuItem> */}
                      {countries.map((country) => (
                        <MenuItem key={country} value={country}>{country}</MenuItem>
                      ))}
                    </TextField>
                  </div>
                  <div className={`${user.role !== 'player' && 'hidden'}`}>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="dob">Date of Birth</label>
                    </div>
                    <Field
                      name="dob"
                      type='date'
                      className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.dob && touched.dob
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                        }`}
                    />
                  </div>
                  <div className={`flex flex-col gap-1 ${user.role !== 'player' && 'hidden'}`}>
                    <div className="opacity-45">
                      <label htmlFor="">Height</label>
                    </div>
                    <div className="flex w-full gap-2">
                      <div className="relative w-1/2">
                        <Field
                          name="heightFt"
                          type='number'
                          className={`py-3 px-3 pl-[6px] md:pl-3 dark-blue-background rounded-lg w-full text-primary focus:outline-none placeholder:opacity-45 ${errors.heightFt && touched.heightFt
                            ? "border-red-900	border"
                            : "primary-border focus:border-green-500"
                            }`}
                        />
                        <div className="absolute bottom-3 right-4 opacity-50 text-white">ft</div>
                      </div>
                      <div className="relative w-1/2">
                        <Field
                          name="heightIn"
                          type='number'
                          className={`py-3 px-3 pl-[6px] md:pl-3 dark-blue-background rounded-lg  w-full text-primary focus:outline-none placeholder:opacity-45 ${errors.heightIn && touched.heightIn
                            ? "border-red-900	border"
                            : "primary-border focus:border-green-500"
                            }`}
                        />
                        <div className="absolute bottom-3 right-2 md:right-4 opacity-50 text-white">in</div>
                      </div>
                    </div>
                  </div>
                  <div className={`relative ${user.role !== 'player' && 'hidden'}`}>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">Weight</label>
                    </div>
                    <Field
                      name="weight"
                      type='number'
                      className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.weight && touched.weight
                        ? "border-red-900	border"
                        : "primary-border focus:border-green-500"
                        }`}
                      placeholder="Weight"
                    />
                    <div className="absolute bottom-3 right-4 opacity-50 text-white">lbs</div>
                  </div>
                  <div className={`${user.role !== 'player' && 'hidden'}`}>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">Handedness</label>
                    </div>
                    <TextField variant="outlined" placeholder="Select" select value={values.handedness} fullWidth InputProps={{ style: { height: 50 } }} onChange={(e) => setFieldValue('handedness', e.target.value)}>
                      {/* <MenuItem value={''} disabled>Select</MenuItem> */}
                      <MenuItem value={'left'}>Left</MenuItem>
                      <MenuItem value={'right'}>Right</MenuItem>
                    </TextField>
                  </div>
                  <div className={`flex flex-row col-span-2 items-center gap-2 mt-2 ${user.role !== 'player' && 'hidden'}`}>
                    <div>
                      <Checkbox checked={values.anonymous} style={{ width: 20 }} onChange={(e) => setFieldValue('anonymous', e.target.checked)} />
                    </div>
                    <div className="mb-1 opacity-45">
                      <label htmlFor="">Opt out of Leaderboard</label>
                    </div>
                  </div>
                  {response.type === 'profile' && <div className={`flex justify-end col-span-2 ${response.severity === 'success' ? 'text-primary' : 'text-error'}`}>{response.message}</div>}
                  <div></div>
                  <div className="flex justify-start md:justify-end gap-4 col-span-2">
                    <button
                      type="button"
                      onClick={() => resetForm()}
                      className="bg-white dark-blue-color px-4 py-1 rounded font-bold uppercase text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary dark-blue-color px-4 py-1 rounded font-bold uppercase text-sm hover-button-shadow"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
        <div className="flex flex-col md:flex-row space-y-4 primary-border rounded-lg flex items-start md:items-center p-4 mt-8">
          <div className="basis-full md:basis-2/5 flex pl-0 md:pl-6 2xl:pl-20 justify-start md:justify-between flex-col">
            <div>
              <h2 className="text-xl font-bold">Email</h2>
              <p className="text-gray-400">
                Update your email here.
              </p>
            </div>
          </div>
          <div className="basis-full md:basis-3/5 w-full">
            <div className="flex items-center mb-4 gap-6">
              <div className="w-full md:w-1/2">
                <div className="mb-1 opacity-45">
                  <label htmlFor="">Email</label>
                </div>
                <div className="relative">
                  <input
                    name="email"
                    value={user.email}
                    disabled
                    type="text"
                    className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 primary-border focus:border-green-500`}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                type="button"
                onClick={() => setShowUpdateEmailModal(true)}
                className="bg-primary dark-blue-color px-4 py-1 rounded font-bold uppercase text-sm hover-button-shadow"
              >
                Update Email
              </button>
            </div>
          </div>
        </div>
        <Formik
          initialValues={{
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={passwordValidationSchema}
          onSubmit={handleChangePassword}
        >
          {({ errors, touched, values }) => (
            <Form>
              <div className="flex flex-col md:flex-row space-y-4 primary-border rounded-lg flex items-center p-4 mt-8">
                <div className="basis-full md:basis-2/5 flex pl-0 md:pl-6 2xl:pl-20 justify-between flex-col">
                  <div>
                    <h2 className="text-xl font-bold">Password</h2>
                    <p className="text-gray-400">
                      Enter your current password to make updates.
                    </p>
                  </div>
                </div>
                <div className="basis-full md:basis-3/5 w-full">
                  <div className="flex items-center mb-4 gap-6 w-full">
                    <div className="w-full md:w-48-percent">
                      <div className="mb-1 opacity-45">
                        <label htmlFor="">Current Password</label>
                      </div>
                      <div className="relative">
                        <Field
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.currentPassword && touched.currentPassword
                            ? "border-red-900 border"
                            : "primary-border focus:border-green-500"
                            }`}
                          placeholder="Enter current password"
                        />
                        <div
                          className="absolute inset
                        right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center mb-4 gap-6">
                    <div className="w-full md:w-48-percent">
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
                  {response.type === 'password' && <div className={`flex justify-end col-span-2 ${response.severity === 'success' ? 'text-primary' : 'text-error'}`}>{response.message}</div>}
                  <div className="flex justify-end gap-4 mt-4">
                    <button
                      disabled={!values.currentPassword || !values.newPassword || !values.confirmPassword}
                      type="submit"
                      className="bg-primary dark-blue-color px-4 py-1 rounded font-bold uppercase text-sm hover-button-shadow"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
        {showUpdateEmailModal && <UpdateEmailModal open={showUpdateEmailModal} onClose={() => setShowUpdateEmailModal(false)} isVerification={false} onSuccess={fetchUser} />}
        {/* <div className={`space-y-4 primary-border rounded-lg flex items-center p-4 mt-8 ${user.role !== 'player' && 'hidden'}`}>
        <div className="basis-2/5 flex pl-6 2xl:pl-20 justify-between flex-col">
          <div>
            <h2 className="text-xl font-bold">Additional Settings</h2>
            <p className="text-gray-400">
              Update settings for your account
            </p>
          </div>
        </div>
        <div className="basis-3/5">
          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              className="bg-white dark-blue-color px-4 py-1 rounded font-bold uppercase text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary dark-blue-color px-4 py-1 rounded font-bold uppercase text-sm hover-button-shadow"
            >
              Confirm
            </button>
          </div>
        </div>
      </div> */}
      </div >
  );
};

export default AccountSettings;
