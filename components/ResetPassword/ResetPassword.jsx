"use client";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useSearchParams } from "next/navigation";
import * as Yup from "yup";
// import styles from "../../app/login/login.module.css";

const ResetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters"),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
    .required("Confirm new password is required"),
});

const ResetPassword = () => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmNewPassword)
      return setMessage('Passwords mismatch')
    setIsSubmitting(true);
    try {
      await ResetPasswordSchema.validate(values, { abortEarly: false });
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: values.newPassword,
        }),
      });
      const data = await response.json();
      setMessage(data.message);
      if (response.ok) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 5000);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage("An error occurred while resetting the password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-transparent border primary-border rounded-lg max-w-7xl p-8">
      <h2 className="text-white text-3xl font-bold mb-6 text-center">
        Create your Account
      </h2>
      <Formik
        initialValues={{
          newPassword: "",
          confirmNewPassword: "",
        }}
        validationSchema={ResetPasswordSchema}
        onSubmit={handleResetPassword}
      >
        {({ isSubmitting }) => (
          <Form>
            <div className="mb-4 mt-4">
              <Field
                type="password"
                name="newPassword"
                placeholder="Enter your new password"
                className={`w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45`}
              />
              <ErrorMessage
                name="newPassword"
                component="div"
                className="text-red-500 text-sm pl-2 pt-2"
              />
            </div>
            <div className="mb-8 mt-8">
              <Field
                type="password"
                name="confirmNewPassword"
                placeholder="Confirm your new password"
                className={`w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45`}
              />
              <ErrorMessage
                name="confirmNewPassword"
                component="div"
                className="text-red-500 text-sm pl-2 pt-2"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-500 bg-primary rounded-lg w-80 text-black font-normal px-3 py-3 rounded hover-shadow focus:outline-none"
            >
              {isSubmitting ? "Processing..." : "Reset Password"}
            </button>
            {message && <p className="mt-4">{message}</p>}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ResetPassword;
