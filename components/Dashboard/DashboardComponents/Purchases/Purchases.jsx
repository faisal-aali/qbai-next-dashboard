"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import PickCredits from '@/components/Common/PickCredits/PickCredits'
import PaymentForm from "@/components/Common/PaymentForm/PaymentForm";
import CircularProgress from "@mui/material/CircularProgress";
import { useApp } from "@/components/Context/AppContext";

const Purchases = () => {
  const userSession = useSession().data?.user
  const [step, setStep] = useState(1);
  const [credits, setCredits] = useState(null);
  const { user, fetchUser } = useApp()

  const calculateAmount = () => (
    credits * user.subscription.package.amountPerCredit
  )

  return (
    <>
      <div className="flex-1">
        <div className="blueBackground p-8 primary-border rounded-lg flex items-center justify-between w-full md:w-3/5 mb-4">
          <div className="flex flex-col gap-2 md:gap-5">
            <div>
              <h2 className="text-sm md:text-4xl font-normal">
                Your Current Balance: <span className="text-primary font-semibold"> {user?.credits.remaining} <span className="text-zinc-400 text-xs md:text-lg font-normal"> Credits </span></span>
              </h2>
            </div>
            <div>
              <p className="text-zinc-400 text-sm md:text-xl false"> Plan: <span className="text-primary font-semibold">{!user ? '' : user.subscription.package.name}</span> </p>
            </div>
          </div>
        </div>

        {!user ? <CircularProgress /> :
          <div className="p-0 md:p-4">
            {step === 1 && <PickCredits user={user} onSubmit={(credits) => {
              setCredits(credits)
              setStep(2)
            }} />}
            {step === 2 && <PaymentForm onBack={() => setStep(1)} onPaymentSuccess={() => setStep(3)} credits={credits} type='purchase' amount={calculateAmount()} />}
            {step === 3 && (
              <>
                <div className="text-center p-8 primary-border rounded-lg dark-blue-background w-4/6 mx-auto h-450 flex flex-col justify-center items-center">
                  <h2 className="text-primary text-3xl mb-4 font-semibold border-b border-solid pb-4">
                    Purchase Successful!
                  </h2>
                  <p className="text-3xl mb-2 text-white">
                    Your Current Balance
                  </p>
                  <p className="text-5xl mb-6 text-primary">
                    {user?.credits.remaining} <span className="text-zinc-400">Credits</span>
                  </p>
                  <button
                    variant="contained"
                    className="bg-white dark-blue-color px-12 mt-4 py-1 rounded font-bold"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>}
      </div>
    </>
  );
};

export default Purchases;
