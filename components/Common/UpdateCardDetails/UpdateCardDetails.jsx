"use client";
import { useState, useRef } from "react";
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Image from "next/image";
import styles from "./UpdateCardDetails.module.css";
import axios from 'axios'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;

const billingSchema = Yup.object().shape({
    firstName: Yup.string().required("First Name is required"),
    lastName: Yup.string().required("Last Name is required"),
    address: Yup.string().required("Address is required"),
    postalCode: Yup.string()
        .matches(postalCodeRegex, "Invalid postal code format")
        .required("Postal Code is required"),
});

const UpdateCardDetails = ({ onUpdateSuccess }) => {

    return (
        <Elements stripe={stripePromise}>
            <_UpdateCardDetails {...{ onUpdateSuccess }} />
        </Elements>
    )
}

const _UpdateCardDetails = ({ onUpdateSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [updateError, setUpdateError] = useState(null);

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setSubmitting(true)
            setUpdateError(null);

            if (!stripe || !elements) {
                return console.error('stripe or elements not found')
            }

            const { clientSecret } = await axios.post('/api/stripe/customer/paymentMethods').then(res => res.data)

            const cardNumberElement = elements.getElement(CardNumberElement);

            const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: cardNumberElement,
                },
            })

            if (error) {
                setUpdateError(error.message);
                setSubmitting(false);
                // setIsSubmitting(false)
                return;
            }

            const paymentMethodId = setupIntent.payment_method;

            const res = await axios.patch("/api/stripe/customer/paymentMethods", {
                paymentMethodId: paymentMethodId,
            }).then(res => res.data)

            if (res.success) {
                console.log('Successfully updated card details')
                onUpdateSuccess();
            } else {
                throw new Error('Invalid server response')
            }
        } catch (error) {
            console.error("Error occured:", error);
            setUpdateError(`Transaction failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmitting(false);
            // setIsSubmitting(false)
        }
    };

    const customStyles = {
        style: {
            base: {
                color: "#ffffff",
                fontSize: "16px",
                "::placeholder": {
                    color: "#ffffff45",
                },
            },
            invalid: {
                color: "#fa755a",
            },
        },
    };

    return (
        <div className="px-8 py-6 bg-transparent border primary-border rounded-lg">
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
                <Formik
                    initialValues={{
                        firstName: "",
                        lastName: "",
                        address: "",
                        postalCode: "",
                    }}
                    validationSchema={billingSchema}
                    onSubmit={handleSubmit}
                >
                    {({ errors, touched, isSubmitting }) => (
                        <Form className="flex justify-between gap-8">
                            <div className="w-full">
                                <div className="flex items-center mb-4 gap-6">
                                    <div className="w-1/2">
                                        <div className="mb-2 opacity-45">
                                            <label htmlFor="">First Name</label>
                                        </div>
                                        <Field
                                            name="firstName"
                                            placeholder="First Name"
                                            className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                                        />
                                        {errors.firstName && touched.firstName && (
                                            <div className="text-red-500 text-sm">{errors.firstName}</div>
                                        )}
                                    </div>
                                    <div className="w-1/2">
                                        <div className="mb-2 opacity-45">
                                            <label htmlFor="">Last Name</label>
                                        </div>
                                        <Field
                                            name="lastName"
                                            placeholder="Last Name"
                                            className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                                        />
                                        {errors.lastName && touched.lastName && (
                                            <div className="text-red-500 text-sm">{errors.lastName}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="mb-4 ">
                                    <div className="mb-2 opacity-45">
                                        <label htmlFor="">Address</label>
                                    </div>
                                    <Field
                                        name="address"
                                        placeholder="Address"
                                        className="w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                                    />
                                    {errors.address && touched.address && (
                                        <div className="text-red-500 text-sm">{errors.address}</div>
                                    )}
                                </div>
                                <div className="flex mb-4 gap-6">
                                    <div className="w-1/2">
                                        <div className="mb-2 opacity-45">
                                            <label htmlFor="">Credit Card Number</label>
                                        </div>
                                        <CardNumberElement
                                            options={customStyles}
                                            className={`w-full py-4 px-3 bg-transparent primary-border rounded rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45 ${styles.backgroundImage} ${styles.backgroundImageCardNum}`}
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <div className="mb-2 opacity-45">
                                            <label htmlFor="">CVV</label>
                                        </div>
                                        <CardCvcElement
                                            options={customStyles}
                                            className={`w-full py-4 px-3 bg-transparent primary-border rounded rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45 ${styles.backgroundImage} ${styles.backgroundImageCvv}`}
                                        />
                                    </div>
                                </div>
                                <div className="flex mb-4 gap-6">
                                    <div className="w-1/2">
                                        <div className="mb-2 opacity-45">
                                            <label htmlFor="">Expiry Date</label>
                                        </div>
                                        <CardExpiryElement
                                            options={customStyles}
                                            className={`w-full py-4 px-3 bg-transparent primary-border rounded rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45 ${styles.backgroundImage} ${styles.backgroundImageExpiry}`}
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <div className="mb-2 opacity-45">
                                            <label htmlFor="">Postal Code</label>
                                        </div>
                                        <Field
                                            name="postalCode"
                                            placeholder="Postal Code"
                                            className="w-full py-3.5 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                                        />
                                        {errors.postalCode && touched.postalCode && (
                                            <div className="text-red-500 text-sm">
                                                {errors.postalCode}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {updateError && (
                                    <div className="text-red-500 text-lg mb-4">{updateError}</div>
                                )}
                                <div className="flex flex-row justify-between">
                                    <div>
                                        <Image
                                            src="/assets/payment-cards.png"
                                            alt="Logo"
                                            width={250}
                                            height={64}
                                        />
                                    </div>
                                    <div>
                                        <button
                                            className={`px-4 py-1 rounded font-bold bg-primary dark-blue-color hover-button-shadow`}
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default UpdateCardDetails;
