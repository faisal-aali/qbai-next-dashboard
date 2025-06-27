"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UploadModal from "../Dashboard/DashboardComponents/UploadVideoModal/UploadModal";
import AddNewPlayerModal from "../Dashboard/DashboardComponents/AddNewPlayerModal/AddNewPlayerModal";
import { useSession } from "next-auth/react";
import axios from 'axios'
import { useApp } from "../Context/AppContext";

const VideoSubmittedScreen = () => {
  return (
    <div className="flex flex-col gap-8 items-center mt-24">
      <div>
        <img src="/assets/success-large.svg" />
      </div>
      <div>
        <p className="text-center text-2xl md:text-4xl">Video submitted Succesfully!</p>
      </div>
      <div>
        <p className="text-center text:xs md:text-lg">We've received the footage. Typically, results are processed within 10 minutes.</p>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const user = useSession().data?.user || {}
  const router = useRouter();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState("upload");
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [videoSubmitted, setVideoSubmitted] = useState(false);
  const [code, setCode] = useState("")
  const [claimingPromo, setClaimingPromo] = useState(false)
  const { showSnackbar, fetchUser } = useApp()

  // useEffect(() => {
  //   console.log('/dashboard mounted')
  //   router.refresh()
  // }, [])

  useEffect(() => {
    if (user.role === 'admin') router.replace('/profile')
  }, [user]);

  const handleClaimPromoCode = () => {
    setClaimingPromo(true)
    axios.post('/api/promocodes/claim', { code }).then((res) => {
      showSnackbar('Promo code has been claimed!', 'success');
      setCode('')
      fetchUser()
    }).catch(err => {
      showSnackbar(err.response?.data?.message || err?.message || 'Unexpected error occured', 'error');
    }).finally(() => setClaimingPromo(false))
  }

  return (
    videoSubmitted ? <VideoSubmittedScreen /> :
      <div className="flex-1 py-4 md:py-8">
        <div className="flex flex-col bg-transparent primary-border py-16 px-8 rounded-lg text-center gap-8">
          <div>
            <h2 className="text-2xl md:text-5xl font-normal">Ready to enter the lab?</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              className="bg-primary text-black rounded w-36 h-8 flex items-center justify-center text-base hover-button-shadow"
              onClick={() => {
                setUploadType('upload')
                setShowUploadModal(true);
              }}
              style={{ display: user.role === 'player' ? 'block' : 'none' }}
            >
              UPLOAD VIDEO
            </button>
            <button
              className="bg-primary text-black rounded w-36 h-8 flex items-center justify-center text-base hover-button-shadow"
              style={{ display: user.role === 'player' ? 'block' : 'none' }}
            >
              RECORD VIDEO
            </button>
            <button
              className="bg-primary text-black rounded w-48 h-8 flex items-center justify-center text-base ml-4 hover-button-shadow"
              style={{ display: user.role === 'trainer' ? 'block' : 'none' }}
              onClick={() => setShowPlayerModal(true)}
            >
              ADD NEW PLAYER
            </button>
            <button
              className="bg-primary text-black rounded w-48 h-8 flex items-center justify-center text-base ml-4 hover-button-shadow"
              style={{ display: user.role === 'staff' ? 'block' : 'none' }}
              onClick={() => router.push('/users?role=player')}
            >
              VIEW PLAYERS
            </button>
          </div>
          <div className={` ${!['player', 'trainer'].includes(user.role) && 'hidden'}`}>
            <p className="font-light text-xs md:text-sm">
              Discover essential formats and metrics for optimal video results
              before uploading/recording.
            </p>
            <a href="http://www.qbai.com/resources/how-to-record" target="_blank" className="text-primary underline">
              Click here!
            </a>
          </div>
          <div className={`flex gap-4 justify-center ${!['player', 'trainer'].includes(user.role) && 'hidden'}`}>
            <div className="flex w-72 h-10 gap-4">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter promo code" className="w-full py-3.5 px-3 bg-transparent primary-border h-full rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45" />
              <button disabled={claimingPromo || !code} onClick={handleClaimPromoCode} className={`px-4 py-2 rounded-lg font-bold bg-primary dark-blue-color hover-button-shadow`}>
                Apply
              </button>
            </div>
          </div>
        </div>
        {showUploadModal && <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} onSuccess={() => setVideoSubmitted(true)} type={uploadType} />}
        {showPlayerModal && <AddNewPlayerModal open={showPlayerModal} onClose={() => setShowPlayerModal(false)} />}
      </div>
  );
};

export default Dashboard;
