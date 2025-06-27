"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";

const PickCredits = ({ onSubmit, onBack, user }) => {
  const [selectedCredits, setSelectedCredits] = useState(null);

  const calculatePrice = (credits) => (
    ((credits * user.subscription.package.amountPerCredit) / 100).toFixed(2)
  )

  return (
    <div className="flex flex-col gap-8">
      <div className={`${user.subscription.package.plan !== 'free' && 'hidden'}`}>
        <h2 className="text-xl">
          Save money when purchasing subscription
        </h2>
      </div>
      <div className="flex flex-col md:flex-row gap-6 overflow-auto p-2">
        {[1, 5, 10].map((credits, index) => (
          <div
            key={index}
            className={`flex flex-col items-center p-4 py-6 rounded-lg cursor-pointer basis-1/3 h-44 justify-center blueBackground ${selectedCredits === credits
              ? "hover-shadow-light-box"
              : "border primary-border"
              }`}
            onClick={() => setSelectedCredits(credits)}
          >
            <h3 className="text-4xl mb-2">{credits}</h3>
            <h4 className="text-zinc-400 text-base font-normal">
              Credits
            </h4>
            <button
              className={`font-bold px-8 py-1 rounded mt-4 ${selectedCredits === credits
                ? "bg-primary dark-blue-color"
                : "bg-white dark-blue-color"
                }`}
            >
              ${calculatePrice(credits)}
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-center md:justify-end">
        {onBack &&
          <button
            className="bg-white dark-blue-color px-4 py-1 rounded font-bold"
            onClick={onBack}
          >
            Back
          </button>}
        <button
          className={`px-4 py-1 rounded font-bold bg-primary dark-blue-color hover-button-shadow`}
          onClick={() => onSubmit(selectedCredits)}
          disabled={!selectedCredits}
        >
          Continue
        </button>
      </div>
    </div >
  );
};

export default PickCredits;
