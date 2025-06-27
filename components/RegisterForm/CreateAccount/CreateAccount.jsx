"use client";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { getNames } from "country-list";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import { useState } from "react";
import axios from 'axios'
import { convertFeetAndInchesToCm } from "@/util/utils";
import { signIn, signOut } from "next-auth/react";
import { useApp } from '../../Context/AppContext';


const playerAccountSchema = Yup.object().shape({
  firstName: Yup.string().matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]*$/, "First name must contain at least one letter and can only contain letters and numbers").required("First name is required"),
  lastName: Yup.string().matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]*$/, "Last name must contain at least one letter and can only contain letters and numbers").required("Last name is required"),
  city: Yup.string().matches(/^[a-zA-Z\s]*$/, "City must contain only alphabets").required("City is required"),
  state: Yup.string().matches(/^[a-zA-Z\s]*$/, "State must contain only alphabets").required("State is required"),
  country: Yup.string().required("Country is required"),
  heightFt: Yup.number().required("Height (ft) is required"),
  heightIn: Yup.number().max(11, "Height (in) must be between 0 and 11 inches").required("Height (in) is required"),
  handedness: Yup.string().required("Handedness is required"),
  weight: Yup.number().required("Weight is required"),
  password: Yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
  confirmPassword: Yup.string().oneOf([Yup.ref("password"), null], "Passwords must match").required("Confirm password is required"),
  dob: Yup.date().max(new Date(), 'DoB cannot be in the future').required('Date of Birth is required')
});

const trainerAccountSchema = Yup.object().shape({
  firstName: Yup.string().matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]*$/, "First name must contain at least one letter and can only contain letters and numbers").required("First name is required"),
  lastName: Yup.string().matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]*$/, "Last name must contain at least one letter and can only contain letters and numbers").required("Last name is required"),
  city: Yup.string().matches(/^[a-zA-Z\s]*$/, "City must contain only alphabets").required("City is required"),
  state: Yup.string().matches(/^[a-zA-Z\s]*$/, "State must contain only alphabets").required("State is required"),
  country: Yup.string().required("Country is required"),
  password: Yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
  confirmPassword: Yup.string().oneOf([Yup.ref("password"), null], "Passwords must match").required("Confirm password is required"),
});

const CreateAccount = ({ nextStep, values }) => {
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const countries = getNames().sort((a, b) => {
    if (a === 'United States of America') return -1;
    if (b === 'United States of America') return 1;
    return a.localeCompare(b)
  });
  const { showSnackbar } = useApp();

  const onSubmit = (values) => {
    return new Promise((resolve, reject) => {
      if (!values) reject('Invalid request')
      const heightInCm = convertFeetAndInchesToCm(values.heightFt, values.heightIn);
      if (values.dob) values.dob = new Date(values.dob);

      axios.post(values.role === 'player' ? "/api/players" : values.role === 'trainer' ? "/api/trainers" : "invalid_role", {
        ...values,
        height: heightInCm,
        name: `${values.firstName} ${values.lastName}`.trim()
      }).then(res => {
        resolve('User created')
        showSnackbar("Account Created Successfully!", "success");
      }).catch(err => {
        console.error(err)
        reject(`Error occured: ${(err.response.data.message || err.message)}`)
        showSnackbar(err.response?.data?.message || err.message, "error");
      })
    })
  }

  return (
    <Formik
      initialValues={values}
      validationSchema={values.role === 'player' ? playerAccountSchema : trainerAccountSchema}
      onSubmit={(values, { setSubmitting }) => {
        if (!agree) {
          setSubmitting(false)
          setError('Must agree to ToS and Privacy Policy')
          return
        }
        console.log("Account Details:", values);
        onSubmit(values).then(async res => {
          await signIn('credentials', { email: values.email, password: values.password, redirect: false }).catch(err => signOut({ redirect: false }))
          nextStep();
        }).catch(err => {
          setError(err)
        })
          .finally(() => setSubmitting(false));
      }}
    >
      {({ isSubmitting, errors, touched, setFieldValue }) => (
        <div className="w-full px-8">
          <div className="bg-transparent border primary-border rounded-lg max-w-xl w-full">
            <Form className="w-full p-8">
              <h2 className="text-white text-2xl md:text-3xl font-bold mb-6 text-center">
                Create your Account
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full">
                    <Field
                      name="firstName"
                      className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                      placeholder="First Name"
                    />
                    {errors.firstName && touched.firstName ? (
                      <div className="text-red-500 text-sm">
                        {errors.firstName}
                      </div>
                    ) : null}
                  </div>
                  <div className="w-full">
                    <Field
                      name="lastName"
                      className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                      placeholder="Last Name"
                    />
                    {errors.lastName && touched.lastName ? (
                      <div className="text-red-500 text-sm">
                        {errors.lastName}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div>
                  <Field
                    name="city"
                    className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                    placeholder="City"
                  />
                  {errors.city && touched.city ? (
                    <div className="text-red-500 text-sm">{errors.city}</div>
                  ) : null}
                </div>
                <div>
                  <Field
                    name="state"
                    className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                    placeholder="State"
                  />
                  {errors.state && touched.state ? (
                    <div className="text-red-500 text-sm">{errors.state}</div>
                  ) : null}
                </div>
                <div>
                  <Autocomplete
                    autoFocus={false}
                    options={countries}
                    getOptionLabel={(option) => option}
                    onChange={(event, value) => setFieldValue("country", value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="filled"
                        label="Country"
                        fullWidth
                        error={touched.country && Boolean(errors.country)}
                        helperText={touched.country && errors.country}
                      />
                    )}
                    renderOption={(props, option) => (
                      <MenuItem {...props} key={option} value={option}>
                        {option}
                      </MenuItem>
                    )}
                    filterOptions={(options, { inputValue }) =>
                      options.filter((option) =>
                        option.toLowerCase().startsWith(inputValue.toLowerCase())
                      )
                    }
                  />
                  {errors.country && touched.country ? (
                    <div className="text-red-500 text-sm">{errors.country}</div>
                  ) : null}
                </div>
                <div className={`${values.role !== 'player' && 'hidden'}`}>
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex-shrink-0 opacity-45">
                      <p>
                        Date of Birth:
                      </p>
                    </div>
                    <div className="flex-grow">
                      <Field
                        type="date"
                        name="dob"
                        defaultValue="1999-01-01"
                        className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                      />
                    </div>
                  </div>
                  {errors.dob && touched.dob ? (
                    <div className="text-red-500 text-sm">{errors.dob}</div>
                  ) : null}
                </div>
                {values.role === 'player' &&
                  <div className={`flex flex-col md:flex-row gap-6`}>
                    <div className="flex flex-row relative">
                      <div className="flex gap-4">
                        <div className="relative">
                          <Field
                            placeholder='Height'
                            name="heightFt"
                            type="number"
                            className={`py-3 px-3 bg-transparent rounded-lg w-full text-white focus:outline-none placeholder:opacity-45 ${errors.heightFt && touched.heightFt
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
                            placeholder='Height'
                            name="heightIn"
                            type="number"
                            className={`py-3 px-3 bg-transparent rounded-lg  w-full text-white focus:outline-none placeholder:opacity-45 ${errors.heightIn && touched.heightIn
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
                    <div className="flex relative">
                      <Field
                        className={`w-full bg-transparent px-3 rounded-lg py-3 text-white rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                    ${errors.weight && touched.weight
                            ? "border-red-900	border"
                            : "primary-border focus:border-green-500"
                          }`}
                        type="number"
                        name="weight"
                        placeholder='Weight'
                        required
                      />
                      <div className="absolute bottom-3 right-4 opacity-50 text-white">
                        lbs
                      </div>
                    </div>
                  </div>}
                <div className={`${values.role !== 'player' && 'hidden'}`}>
                  <TextField
                    error={Boolean(errors.handedness && touched.handedness)}
                    variant="outlined"
                    select
                    label="Handedness"
                    value={values.handedness}
                    onChange={(e) =>
                      setFieldValue("handedness", e.target.value)
                    }
                    className={`w-full text-primary bg-transparent rounded-lg text-white focus:outline-none focus:border-green-500 placeholder:opacity-45 ${errors.handedness && touched.handedness
                      ? "border-red-900	border"
                      : "primary-border focus:border-green-500"
                      }`}
                  >
                    <MenuItem
                      className="bg-slate-700"
                      value="left"
                      style={{ color: "#FFF" }}
                    >
                      Left
                    </MenuItem>
                    <MenuItem
                      className="bg-slate-700"
                      value="right"
                      style={{ color: "#FFF" }}
                    >
                      Right
                    </MenuItem>
                  </TextField>
                </div>
                <div>
                  <Field
                    name="password"
                    autoComplete="new-password"
                    type="password"
                    className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                    placeholder="Password"
                  />
                  {errors.password && touched.password ? (
                    <div className="text-red-500 text-sm">{errors.password}</div>
                  ) : null}
                </div>
                <div>
                  <Field
                    name="confirmPassword"
                    type="password"
                    className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                    placeholder="Confirm Password"
                  />
                  {errors.confirmPassword && touched.confirmPassword ? (
                    <div className="text-red-500 text-sm">
                      {errors.confirmPassword}
                    </div>
                  ) : null}
                </div>
                <div className=" flex gap-4 items-center mb-4">
                  <div>
                    <Checkbox
                      name=""
                      sx={{ width: 10, height: 10, color: '#FFFFFF30' }}
                      disableRipple
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                    />
                  </div>
                  <div className="opacity-45">
                    <label>I agree to the <span className="text-primary font-bold underline cursor-pointer">
                      <a href="http://www.qbai.com/terms-of-service" target="_blank">
                        Terms of Service
                      </a>
                    </span> and <span className="text-primary font-bold underline cursor-pointer">
                        <a href="http://www.qbai.com/privacy-policy" target="_blank">
                          Privacy Policy
                        </a>
                      </span></label>
                  </div>
                </div>
                <div className={`text-error ${!error && 'hidden'}`}>
                  {error}
                </div>
                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting || !agree}
                    className={`w-full bg-green-500 bg-primary rounded-lg text-black font-normal py-3 rounded hover-shadow focus:outline-none ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            </Form>
          </div>
        </div>
      )}
    </Formik>
  );
};

export default CreateAccount;
