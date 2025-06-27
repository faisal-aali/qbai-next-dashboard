"use client";
import { useState, useRef, useEffect } from "react";
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Formik, Form, Field, useFormikContext } from "formik";
import * as Yup from "yup";
import Image from "next/image";
import styles from "./PaymentForm.module.css";
import axios from 'axios'
import { useApp } from "@/components/Context/AppContext";

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

const PaymentForm = ({ onPaymentSuccess, type, _package, credits, amount, onBack }) => {

    return (
        <Elements stripe={stripePromise}>
            <_PaymentForm {...{ onPaymentSuccess, type, _package, credits, amount, onBack }} />
        </Elements>
    )
}


const _PaymentForm = ({ onPaymentSuccess, type, _package, credits, amount, onBack }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentError, setPaymentError] = useState(null);
    const formikRef = useRef();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { fetchUser } = useApp();

    const [promocode, setPromocode] = useState();
    const [code, setCode] = useState('');
    const [promocodeError, setPromocodeError] = useState('');

    const handleSubmit = async (values) => {
        console.log(formikRef.current)
        console.log('handleSubmit clicked')
        setIsSubmitting(true)
        // setIsSubmitting(true)
        setPaymentError(null);

        if (!stripe || !elements) {
            return console.error('stripe or elements not found')
        }

        const cardNumberElement = elements.getElement(CardNumberElement);

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardNumberElement,
            billing_details: {
                name: `${values.firstName} ${values.lastName}`,
                address: {
                    line1: values.address,
                    postal_code: values.postalCode,
                },
            },
        });

        if (error) {
            setPaymentError(error.message);
            setIsSubmitting(false);
            // setIsSubmitting(false)
            return;
        }

        try {
            let res;
            if (type === 'subscription') {
                if (!_package) throw new Error('No package selected')
                res = await axios.post("/api/stripe/subscription", {
                    paymentMethodId: paymentMethod.id,
                    packageId: _package._id
                }).then(res => res.data)
            } else if (type === 'purchase') {
                if (!credits) throw new Error('No credits selected')
                res = await axios.post("/api/stripe/payment", {
                    paymentMethodId: paymentMethod.id,
                    credits: credits,
                    promocodeId: promocode?._id
                }).then(res => res.data)
            } else {
                throw new Error('Invalid payment type')
            }

            if (res.requiresAction) {
                const { error: actionError } = await stripe.confirmCardPayment(res.paymentIntentClientSecret);

                if (actionError) {
                    throw new Error(`Card verification failed. ${actionError?.message}`);
                    // Handle error
                } else {
                    // Inform the server to confirm the payment intent
                    //   await fetch('/api/confirm-payment-intent', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify({ paymentIntentId: result.paymentIntentId }),
                    //   });
                    setTimeout(() => {
                        onPaymentSuccess();
                    }, 3000);
                }
            } else if (res.success) {
                setTimeout(() => {
                    onPaymentSuccess();
                }, 3000);
            } else {
                throw new Error('Invalid server response')
            }
        } catch (error) {
            console.error("Error occured:", error);
            setPaymentError(`Transaction failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setTimeout(() => {
                fetchUser()
                setIsSubmitting(false);
            }, 3000);
            // setIsSubmitting(false)
        }
    };

    const applyPromocode = () => {
        axios.get('/api/promocodes', { params: { code } }).then(res => {
            setPromocode(res.data[0])
            setPromocodeError('')
        }).catch(err => {
            setPromocodeError(err.response.data?.message || err.message)
        })
    }

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

    const discountedAmount = promocode ? amount * (1 - (promocode.discountPercentage / 100)) : amount

    const parseAmount = (amount) => (
        (amount / 100).toFixed(2)
    )

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-8">
            <div className="px-4 md:px-8 py-6 bg-transparent border primary-border rounded-lg">
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
                        innerRef={formikRef}
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
                            <Form className="flex justify-between gap-8 max-w-7xl">
                                <div className="w-full">
                                    <div className="flex flex-col md:flex-row items-center mb-4 gap-6">
                                        <div className="w-full md:w-1/2">
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
                                        <div className="w-full md:w-1/2">
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
                                    <div className="flex flex-col md:flex-row mb-4 gap-6">
                                        <div className="w-full md:w-1/2">
                                            <div className="mb-2 opacity-45">
                                                <label htmlFor="">Credit Card Number</label>
                                            </div>
                                            <CardNumberElement
                                                options={customStyles}
                                                className={`w-full py-4 px-3 bg-transparent primary-border rounded rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45 ${styles.backgroundImage} ${styles.backgroundImageCardNum}`}
                                            />
                                        </div>
                                        <div className="w-full md:w-1/2">
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
                                    {paymentError && (<div className="text-red-500 text-lg mb-4">{paymentError}</div>)}
                                    <div>
                                        <Image
                                            src="/assets/payment-cards.png"
                                            alt="Logo"
                                            width={250}
                                            height={64}
                                        />
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
            {type === 'subscription' ?
                <div className="w-full lg:w-2/5 rounded-lg p-8 md:p-6 blueBackground flex justify-center items-center">
                    <div className="w-full justify-between text-white rounded-lg">
                        <h2 className="font-bold mb-4">SUMMARY</h2>
                        <div className="border-b-2 border-dashed mb-4"></div>
                        <div className="mb-4">
                            <div className="">
                                <h3 className="capitalize">{_package.name}</h3>
                                <h2 className="text-primary">${(_package.amount / 100).toFixed(2)} {_package.plan}</h2>
                            </div>
                        </div>
                        <div className="my-8">
                            <div className="mb-4">
                                <div className="flex justify-between">
                                    <h3 className="text-xl">SubTotal</h3>
                                    <h3 className="text-xl">${(_package.amount / 100).toFixed(2)}</h3>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between">
                                    <h3 className="text-xl">Total</h3>
                                    <h3 className="text-xl">${(_package.amount / 100).toFixed(2)}</h3>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between">
                                    <h3 className="text-xl">Due Today</h3>
                                    <h3 className="text-xl">${(_package.amount / 100).toFixed(2)}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => formikRef.current.handleSubmit()}
                                disabled={isSubmitting}
                                className="bg-primary rounded-lg text-black font-normal py-3 hover-shadow focus:outline-none"
                            >
                                {/* {isSubmitting ? "Processing..." : "START YOUR FREE TRIAL"} */}
                                PAY
                            </button>
                            {onBack &&
                                <button
                                    onClick={onBack}
                                    className="bg-white rounded-lg text-black font-normal py-3 hover-shadow focus:outline-none"
                                >
                                    {/* {isSubmitting ? "Processing..." : "START YOUR FREE TRIAL"} */}
                                    BACK
                                </button>}
                        </div>
                    </div>
                </div> : type === 'purchase' ?
                    <div className="w-full lg:w-2/5 pl-8 rounded-lg p-6 blueBackground flex justify-center items-center">
                        <div className="w-full justify-between text-white rounded-lg">
                            <h2 className="font-bold mb-4">SUMMARY</h2>
                            <div className="border-b-2 border-dashed mb-4"></div>
                            <div className="mb-4">
                                <div className="">
                                    <h3 className="capitalize">{credits} Credits</h3>
                                    <div className="flex flex-row gap-1">
                                        <h2 className={`text-white line-through text-3xl ${amount === discountedAmount && 'hidden'}`}>${parseAmount(amount)}</h2>
                                        <h2 className="text-primary">${parseAmount(discountedAmount)}</h2>
                                    </div>
                                </div>
                            </div>
                            <div className="my-8">
                                <div className="mb-4">
                                    <div className="flex justify-between">
                                        <h3 className="text-xl">SubTotal</h3>
                                        <h3 className="text-xl">${parseAmount(discountedAmount)}</h3>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between">
                                        <h3 className="text-xl">Total</h3>
                                        <h3 className="text-xl">${parseAmount(discountedAmount)}</h3>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between">
                                        <h3 className="text-xl">Due Today</h3>
                                        <h3 className="text-xl">${parseAmount(discountedAmount)}</h3>
                                    </div>
                                </div>
                                {promocode &&
                                    <div className="mb-4">
                                        <div className="flex justify-between">
                                            <h3 className="text-xl text-primary">Promo code</h3>
                                            <h3 className="text-xl text-primary">{promocode.code}</h3>
                                        </div>
                                    </div>}
                            </div>
                            <div className="flex gap-4 justify-center">
                                <div>
                                    <input
                                        className="w-full py-3.5 px-3 bg-transparent primary-border h-full rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45"
                                        placeholder="Enter promo code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <button
                                        onClick={applyPromocode}
                                        disabled={promocode ? true : false}
                                        type="button"
                                        className="bg-primary h-full w-24 rounded-lg text-black font-normal hover-shadow focus:outline-none"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                            {promocodeError && (<div className="justify-center flex text-red-500 text-lg my-2">{promocodeError}</div>)}
                            <div className="mt-4 flex flex-col gap-4">
                                <button
                                    onClick={() => formikRef.current.handleSubmit()}
                                    disabled={isSubmitting}
                                    className="bg-primary rounded-lg text-black font-normal py-3 hover-shadow focus:outline-none"
                                >
                                    {/* {isSubmitting ? "Processing..." : "START YOUR FREE TRIAL"} */}
                                    PAY
                                </button>
                                {onBack &&
                                    <button
                                        onClick={onBack}
                                        className="bg-white rounded-lg text-black font-normal py-3 hover-shadow focus:outline-none"
                                    >
                                        {/* {isSubmitting ? "Processing..." : "START YOUR FREE TRIAL"} */}
                                        BACK
                                    </button>}
                            </div>
                        </div>
                    </div> : <></>
            }
        </div>
    );
};

export default PaymentForm;
