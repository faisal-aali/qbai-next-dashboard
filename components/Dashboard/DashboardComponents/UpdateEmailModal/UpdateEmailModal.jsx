"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";
import axios from 'axios';
import { useApp } from '../../../Context/AppContext';


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

const UpdateEmailModal = ({ open, onClose, isVerification, onSuccess }) => {
    const { data, update } = useSession()
    const user = data?.user || {}
    const [email, setEmail] = useState()
    const [currentStep, setCurrentStep] = useState(0);
    const [response, setResponse] = useState({});
    const { showSnackbar, fetchUser } = useApp();


    const timeout = useRef()

    useEffect(() => {
        return () => {
            setCurrentStep(0)
        }
    }, [])

    useEffect(() => {
        if (response.message) {
            clearTimeout(timeout.current)
            timeout.current = setTimeout(() => setResponse({}), 3000);
        }
    }, [response])

    const sendOTP = async (email, proceed) => {
        if (!isVerification) {
            try {
                const res = await axios.get('/api/users/emailExists', { params: { email } })
                if (res.data) {
                    return showSnackbar("The email is already registered", "error");
                }
            } catch (err) {
                return showSnackbar(err.response?.data?.message || err.message, "error");
            }
        }
        axios.post("/api/users/OTP", {
            email: user.email,
            receiverEmail: email
        }).then(res => {
            setEmail(email)
            showSnackbar("OTP code has been sent on your email!", "success");
            if (proceed)
                setCurrentStep(1)
        }).catch(err => {
            setResponse({
                message: err.response?.data?.message || err.message,
                severity: 'error'
            })
            showSnackbar(err.response?.data?.message || err.message, "error");
        })
    };

    const resetEmail = (otp) => {
        axios.patch("/api/users/resetEmail", { otp, email }).then(res => {
            update({
                user: {
                    email,
                    emailVerified: true
                }
            })
            fetchUser()
            setCurrentStep(2)
            onSuccess && onSuccess()
        }).catch(err => {
            showSnackbar(err.response?.data?.message || err.message, "error");
        })
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} className="max-w-2xl blueBackground px-16">
                <IconButton
                    style={{ position: "absolute", top: 10, right: 10, color: "#fff" }}
                    onClick={onClose}
                >
                    <CloseIcon />
                </IconButton>
                {currentStep === 0 && (
                    <div>
                        <h2 className="text-lg mt-4 font-bold mb-8 text-center flex flex-col">
                            Please enter your email to receive a verification code.
                        </h2>
                        <Formik
                            initialValues={{ email: isVerification ? user.email : "" }}
                            validationSchema={Yup.object({
                                email: Yup.string().email("Invalid email address").required("Email is required"),
                            })}
                            onSubmit={(values) => sendOTP(values.email, true).catch(console.error)}
                        >
                            {({ errors, touched }) => (
                                <Form>
                                    <div className={`grid gap-2`}>
                                        <div className="opacity-45">
                                            <label htmlFor="email">Email</label>
                                        </div>
                                        <Field
                                            className={`text-primary bg-transparent px-3 rounded-lg py-3 text-white rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                    ${errors.email && touched.email
                                                    ? "border-red-900 border"
                                                    : "primary-border focus:border-green-500"
                                                }`}
                                            type="text"
                                            name="email"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            color="primary"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="contained" color="primary">
                                            Verify
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                )}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-2xl mt-4 font-bold mb-8 text-center flex flex-col">
                            Enter the OTP code sent to your email.
                        </h2>
                        <Formik
                            initialValues={{ otp: ["", "", "", "", "", ""] }}
                            validationSchema={Yup.object({
                                otp: Yup.array().of(Yup.string().matches(/^\d$/, "Must be exactly one digit").required("Required")),
                            })}
                            onSubmit={(values) => resetEmail(Number(values.otp.join('')))}
                        >
                            {({ values, handleChange, handleBlur, setFieldValue }) => (
                                <Form>
                                    <div className="flex justify-center mb-4">
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
                                    <div className="flex justify-center gap-2 mt-4">
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => sendOTP(email, false)}
                                        >
                                            Resend Code
                                        </Button>
                                        <Button type="submit" variant="contained" color="primary">
                                            Verify
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                )}
                {currentStep === 2 && (
                    <div className="w-auto mt-4">
                        <h4 className="text-center">
                            Your email has been {isVerification ? 'verified' : 'updated'}!
                        </h4>
                        <div className="flex justify-center gap-2 mt-4">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={onClose}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                )}
                {response.message && <div className={`flex justify-center mt-4 col-span-2 ${response.severity === 'success' ? 'text-primary' : 'text-error'}`}>{response.message}</div>}
            </Box>
        </Modal>
    );
};

export default UpdateEmailModal;
