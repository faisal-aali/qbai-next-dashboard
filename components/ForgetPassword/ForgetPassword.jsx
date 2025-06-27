"use client";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
// import styles from "../../app/login/login.module.css";
import * as Yup from "yup";
import axios from "axios";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";


const ForgetPassword = () => {
  const router = useRouter()
  const [screen, setScreen] = useState(0)
  const [email, setEmail] = useState('')
  const [OTP, setOTP] = useState('')

  const sendOTP = async (email) => {
    return new Promise((resolve, reject) => {
      axios.post("/api/users/OTP", { email }).then(res => {
        setEmail(email)
        resolve('OTP code has been sent on your email')
      }).catch(err => {
        reject(err.response?.data?.message || err.message)
      })
    })
  };

  const verifyOTP = async (code) => {
    return new Promise((resolve, reject) => {
      axios.get("/api/users/OTP", { params: { otp: code } }).then(res => {
        if (res.data) {
          setOTP(code)
          resolve()
        } else {
          reject('Invalid OTP code')
        }
      }).catch(err => {
        reject(err.response?.data?.message || err.message)
      })
    })
  };

  const resetPassword = async (password) => {
    return new Promise((resolve, reject) => {
      axios.patch("/api/users/resetPassword", { otp: OTP, password }).then(res => {
        resolve()
      }).catch(err => {
        reject(err.response?.data?.message || err.message)
      })
    })
  };

  const EnterEmailScreen = () => {
    const [message, setMessage] = useState("");

    const schema = Yup.object().shape({
      email: Yup.string().email("Invalid email address").required("Email is required"),
    });

    return (
      <div style={{ display: screen === 0 ? 'flex' : 'none' }}>
        <Formik
          initialValues={{ email: "" }}
          validationSchema={schema}
          onSubmit={(values) => {
            sendOTP(values.email).then((res) => {
              setScreen(1)
            }).catch(setMessage)
          }}
        >
          <Form>
            <div className="mb-4 mt-4">
              <Field
                type="email"
                name="email"
                placeholder="Enter your email"
                className={`w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45`}
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-red-500 text-sm pl-2 pt-2"
              />
            </div>
            {message && <p className="mt-4 text-error ">{message}</p>}
            <button
              type="submit"
              className="mt-4 bg-green-500 bg-primary rounded-lg w-80 text-black font-normal px-3 py-3 rounded hover-shadow focus:outline-none"
            >
              Reset Password
            </button>
          </Form>
        </Formik>
      </div>
    )
  }

  const EnterOTPScreen = () => {
    const [message, setMessage] = useState("");

    const schema = Yup.object({
      otp: Yup.array().of(
        Yup.string().matches(/^\d$/, "Must be exactly one digit").required("Required")
      ),
    })

    return (
      <div style={{ display: screen === 1 ? 'flex' : 'none' }}>
        <Formik
          initialValues={{ otp: ["", "", "", "", "", ""] }}
          validationSchema={schema}
          onSubmit={(values) => {
            verifyOTP(Number(values.otp.join(''))).then((res) => {
              setScreen(2)
            }).catch(setMessage)
          }}
        >
          {({ values, handleBlur, setFieldValue }) => (
            <Form>
              <div className="flex flex-col justify-center mb-4">
                <h2 className="text-2xl font-bold mb-8 text-center flex flex-col">
                  Enter the OTP code sent to your email.
                </h2>
                <div className="flex justify-center">
                  {values.otp.map((_, index) => (
                    <input
                      key={index}
                      name={`otp[${index}]`}
                      type="text"
                      maxLength="1"
                      onChange={(e) => {
                        const { value } = e.target;
                        if (/^\d$/.test(value) || value === "") {
                          setFieldValue(`otp[${index}]`, value);
                          if (value !== "" && e.target.nextSibling) {
                            e.target.nextSibling.focus();
                          }
                        }
                      }}
                      onBlur={handleBlur}
                      value={values.otp[index]}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !values.otp[index] &&
                          e.target.previousSibling
                        ) {
                          e.target.previousSibling.focus();
                        }
                      }}
                      autoComplete="off"
                      className="w-10 h-10 m-1 text-center text-black text-lg border border-gray-400 rounded"
                    />
                  ))}
                </div>
                {message && <p className="mt-4 text-error ">{message}</p>}
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    onClick={() => sendOTP(email).then(setMessage).catch(setMessage)}
                  >
                    Resend Code
                  </Button>
                  <Button type="submit" variant="contained" color="primary">
                    Verify
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    )
  }

  const EnterPasswordScreen = () => {
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState()

    const schema = Yup.object({
      newPassword: Yup.string().required("Required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
        .required("Required"),
    });

    return (
      <div style={{ display: screen === 2 ? 'flex' : 'none' }}>
        <Formik
          initialValues={{
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={schema}
          onSubmit={(values) => {
            resetPassword(values.newPassword).then(() => {
              setScreen(3)
            }).catch(setMessage)
          }}
        >
          {({ errors, touched, values }) => (
            <Form>
              <div className="flex flex-col w-96 gap-4">
                <div>
                  <div className="mb-1 opacity-45">
                    <label htmlFor="">New Password</label>
                  </div>
                  <div className="relative">
                    <Field
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.newPassword && touched.newPassword
                        ? "border-red-900 border"
                        : "primary-border focus:border-green-500"
                        }`}
                      placeholder="Enter new password"
                    />
                    <div
                      className="absolute inset right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 opacity-45">
                    <label htmlFor="">Confirm Password</label>
                  </div>
                  <div className="relative">
                    <Field
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.confirmPassword && touched.confirmPassword
                        ? "border-red-900 border"
                        : "primary-border focus:border-green-500"
                        }`}
                      placeholder="Confirm"
                    />
                    <div
                      className="absolute inset right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </div>
                  </div>
                </div>
                {message && <p className="mt-4 text-error ">{message}</p>}
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    disabled={!values.newPassword && !values.confirmPassword}
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
      </div>
    )
  }

  const SuccessScreen = () => (
    <div className="flex flex-col gap-6 items-center" style={{ display: screen === 3 ? 'flex' : 'none' }}>
      <h2 className={`text-primary text-3xl font-bold text-center`}>
        Your password has been reset!
      </h2>
      <button onClick={() => router.replace('/login')} className="bg-green-500 bg-primary rounded-lg w-24 text-black font-normal px-3 py-3 rounded hover-shadow focus:outline-none">
        Login
      </button>
    </div>
  )

  return (
    <div className="bg-transparent border primary-border rounded-lg max-w-7xl p-8">
      <h2 className={`text-white text-3xl font-bold mb-6 text-center ${screen === 3 && 'hidden'}`}>
        Forgot Password
      </h2>
      <EnterEmailScreen />
      <EnterOTPScreen />
      <EnterPasswordScreen />
      <SuccessScreen />
    </div>
  );
};

export default ForgetPassword;
