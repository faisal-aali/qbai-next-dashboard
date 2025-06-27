"use client";
import { useRef, useState } from "react";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
// import Image from "next/image";
// import styles from "./CheckoutForm.module.css";
import PaymentForm from '../../Common/PaymentForm/PaymentForm'

const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;

const billingSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name is required"),
  lastName: Yup.string().required("Last Name is required"),
  address: Yup.string().required("Address is required"),
  postalCode: Yup.string()
    .matches(postalCodeRegex, "Invalid postal code format")
    .required("Postal Code is required"),
});

const CheckoutForm = ({ onPaymentSuccess, values }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formikRef = useRef()

  return (
    <div className="flex px-[75px] 2xl:px-[180px] gap-[40px]">
      <div className="w-7/12 px-8 py-6 bg-transparent border primary-border rounded-lg">
        <div className="text-center mb-4">
          <h2 className="text-white font-bold mb-4 text-2xl">
            Billing Details
          </h2>
          <p className="text-white">
            Data is protected under the PCI DSS standard. We do not store
            your data and do not share it with the merchant.
          </p>
        </div>
        <div>
          <PaymentForm onPaymentSuccess={onPaymentSuccess} formikRef={formikRef} setIsSubmitting={setIsSubmitting} />
        </div>
      </div>
      <div className="w-5/12 pl-8  rounded-lg p-6 blueBackground flex justify-center items-center">
        <div className=" text-white rounded-lg">
          <h2 className="font-bold mb-4">SUMMARY</h2>
          <div className="border-b-2 border-dashed mb-4"></div>
          <div className="mb-4">
            <div className="">
              <h3 className="capitalize">{values.plan}</h3>
              <h2 className="text-primary">$460.00</h2>
            </div>
          </div>
          <div className="my-12">
            <div className="mb-4">
              <div className="flex justify-between">
                <h3 className="text-xl">SubTotal</h3>
                <h3 className="text-xl">$460.00</h3>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between">
                <h3 className="text-xl">Total</h3>
                <h3 className="text-xl">$460.00</h3>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between">
                <h3 className="text-xl">Due Today</h3>
                <h3 className="text-xl">$0.00</h3>
              </div>
            </div>
          </div>
          <p className="text-zinc-400 mb-4">
            Your free trial begins on May 21, 2024 and will end on May 28,
            2024. You'll be charged $460.00 a year on an annual plan
            starting on May 28, 2024.
          </p>
          <button
            onClick={() => formikRef.current.handleSubmit()}
            disabled={isSubmitting}
            className="w-full bg-green-500 bg-primary rounded-lg text-black font-normal py-3 hover-shadow focus:outline-none"
          >
            {isSubmitting ? "Processing..." : "START YOUR FREE TRIAL"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
