"use client";

import { useState, useEffect, useRef } from "react";
import PickYourMembership from '../../../Common/PickYourMembership/PickYourMembership';
import PaymentForm from "@/components/Common/PaymentForm/PaymentForm";
import axios from 'axios';
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { useApp } from "@/components/Context/AppContext";
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

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

const Subscriptions = () => {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState(null);
  const [_package, setPackage] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const { showSnackbar, user, fetchUser } = useApp();

  const initialLoad = useRef(false)
  useEffect(() => {
    if (!user || initialLoad.current) return
    if (!user.subscription || user.subscription.package.plan === 'free')
      setStep(2)
    initialLoad.current = true;
  }, [user])

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true);
      const { success } = await axios.post('/api/stripe/subscription/cancel', { userId: user._id }).then(res => res.data);
      if (!success) showSnackbar(`Unexpected error occurred`, 'error');
      else showSnackbar(`Your subscription has been cancelled`, 'success');
      setTimeout(() => {
        setCanceling(false);
        fetchUser();
        setStep(1);
      }, 3000);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      showSnackbar(`Error canceling subscription: ${error.response?.data?.message || error.message}`, 'error')
      setCanceling(false);
    }
  };

  const openConfirmationModal = () => {
    setOpenCancelModal(true);
  };

  const closeConfirmationModal = () => {
    setOpenCancelModal(false);
  };

  const confirmCancelSubscription = () => {
    closeConfirmationModal();
    handleCancelSubscription();
  };

  return (
    <div className="flex-1 py-8">
      <div className="p-4 flex items-center justify-between w-full mb-4 -mt-16 h-32">
        <div className="flex gap-5 items-center">
          <div className="ml-0 md:ml-4">
            <h2 className="text-2xl md:text-4xl font-normal">Change your Plan</h2>
            <p className="text:sm md:text-base text-white mt-2">Update your plan here.</p>
          </div>
        </div>
      </div>

      {!user ? <CircularProgress /> :
        <div className="p-4">
          {step === 1 && (
            <div className="w-fit blueBackground text-center p-8 rounded-lg mx-auto">
              <div className="flex flex-col justify-center items-center h-full gap-4">
                <h2 className="text-white text-lg md:text-3xl font-semibold capitalize">
                  Active Subscription: <span className="text-primary">{user.subscription.package?.name}</span>
                </h2>
                <p className="text-white text-base">
                  Status: {user.subscription.status === 'canceled' ? `Cancels on ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}` : user.subscription.status}
                </p>
                <p className={`text-white text-base ${(user.subscription.status !== 'active' || user.subscription.type !== 'paid') && 'hidden'}`}>
                  Next Billing Date: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
                <p className="text-white text-base">
                  Amount: ${(user.subscription.amount / 100).toFixed(2)} {user.subscription.package?.plan}
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    variant="contained"
                    className="bg-primary w-64 text-black font-bold px-12 py-1 rounded"
                    onClick={() => setStep(2)}
                  >
                    Change Plan
                  </button>
                  <button
                    variant="contained"
                    className={`bg-transparent border border-red-500 w-64 font-bold px-12 py-1 rounded ${(user.subscription.status === 'canceled' || user.subscription.type === 'gift') && 'hidden'}`}
                    onClick={openConfirmationModal}
                  >

                    {canceling ? <CircularProgress size={20} /> : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <PickYourMembership
              role={user.role}
              excludeFree={true}
              onSubmit={(_package) => {
                setPackage(_package);
                setStep(3);
              }}
            />
          )}
          {step === 3 && (
            <PaymentForm
              onBack={() => setStep(2)}
              onPaymentSuccess={() => setStep(4)}
              _package={_package}
              type="subscription"
            />
          )}
          {step === 4 && (
            <div className="text-center p-8 rounded-lg mx-auto">
              <div className="flex flex-col justify-center items-center h-full">
                <img
                  src="/assets/checkmark.png"
                  alt="Activated"
                  className="w-24 h-24 mb-4"
                />
                <h2 className="text-white text-3xl mt-2 mb-4 font-semibold capitalize">
                  Your {_package.plan} plan has been activated!
                </h2>
                <button
                  variant="contained"
                  className="bg-white text-black font-bold px-12 py-1 rounded mt-4"
                  onClick={() => fetchUser(() => setStep(1))}
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>}
      <Modal open={openCancelModal} onClose={closeConfirmationModal} aria-labelledby="delete-modal-title">
        <Box sx={style} className="w-full max-w-lg blueBackground">
          <div className="flex flex-col justify-center items-center gap-5 py-7">
            <div className="text-error ">
              <ReportProblemIcon sx={{ fontSize: '45px' }} />
            </div>
            <div>
              <p className="text-lg">
                Are you sure you want to cancel the subscription ?
              </p>
            </div>
            <div className="flex flex-row gap-4">
              <div className="flex justify-center">
                <button
                  onClick={closeConfirmationModal}
                  className="bg-white dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold"
                >
                  CANCEL
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={confirmCancelSubscription}
                  className="bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default Subscriptions;
