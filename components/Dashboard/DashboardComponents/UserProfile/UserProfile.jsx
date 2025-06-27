"use client"

import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from 'react';
import axios from 'axios';
import EditUserModal from "../EditUserModal/EditUserModal";
import DeleteUserModal from "../DeleteUserModal/DeleteUserModal";
import GiftUserModal from "../GiftUserModal/GiftUserModal";
import GiftMembershipModal from "../GiftMembershipModal/GiftMembershipModal";
import { useSession } from "next-auth/react";
import Metrics from "../Metrics/Metrics";
import History from "../History/History";
import PlayersHistory from "../PlayersHistory/PlayersHistory";
import { convertCmToFeetAndInches, convertDoBToAge } from "@/util/utils";
import { formatLocation } from "@/util/utils";


const PlayerProfile = ({ setGiftUserId, setShowEditModal, setShowDeleteModal, setShowGiftModal, setShowGiftMembershipModal, giftMembershipType, setGiftMembershipType, userData }) => {

    const user = useSession().data?.user || {}

    useEffect(() => {
        if (!userData) return
        axios.get('/api/users/giftMembership/exists', { params: { userId: userData._id } }).then((res) => {
            if (res.data.subscription) setGiftMembershipType('cancel')
            else setGiftMembershipType('grant')
        }).catch(console.error)
    }, [userData])

    return (
        <div>
            <div className="flex-col lg:flex-row max-w-4xl gap-4 p-8 rounded-2xl flex items-center md:items-start" style={{ background: "linear-gradient(115.84deg, #32E100 -127.95%, #090F21 66.31%)", }} >
                <div>
                    <img
                        className="w-[304px] h-auto md:h-[429px] rounded-lg"
                        src={userData.avatarUrl || "/assets/player-large.png"}
                        alt={userData.name}
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                <div className="flex-1 w-full">
                    <div
                        className="flex flex-col md:flex-row justify-between items-center mb-2 rounded-lg p-4 gap-4"
                        style={{ background: "#32E1004D", padding: "11px 12px" }}
                    >
                        <h2 className="text-2xl md:text-4xl font-normal capitalize">{userData.name}</h2>
                        <div className={`flex gap-4 ${user.role !== 'admin' && 'hidden'}`}>
                            <button onClick={() => setShowEditModal(true)} className="bg-white flex justify-center items-center w-8 h-8 md:w-12 md:h-12 text-green-600 rounded-lg p-2 focus:outline-none">
                                <img src="/assets/edit-icon.svg" alt="" />
                            </button>
                            <button onClick={() => setShowDeleteModal(true)} className="button-danger flex justify-center items-center w-8 h-8 md:w-12 md:h-12 rounded-lg p-2 focus:outline-none">
                                <img src="/assets/delete-icon-white.svg" alt="" />
                            </button>
                        </div>
                    </div>
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Email: <span className="font-normal">{userData.email}</span>
                    </p>
                    <div className="flex flex-col lg:flex-row">
                        <p className="flex-1 text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                            Age: <span className="text-primary">{convertDoBToAge(userData.roleData.dob) || "N/A"}</span>
                        </p>
                    </div>
                    <div className="flex flex-col lg:flex-row">
                        <p className="flex-1 text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                            Location: <span className="text-primary capitalize">{formatLocation(userData.city, userData.state, userData.country)}</span>
                        </p>
                    </div>
                    <div className="flex flex-col lg:flex-row">
                        <p className="flex-1 text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                            Height: <span className="text-primary">{convertCmToFeetAndInches(userData.roleData.height).string || "N/A"}</span>
                        </p>
                        <p className="flex-1 text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                            Weight: <span className="text-primary">{userData.roleData.weight || "N/A"} lbs</span>
                        </p>
                    </div>
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Joining Date: <span className="text-primary">{new Date(userData.creationDate).toLocaleDateString()}</span>
                    </p>
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Remaining Credits: <span className="text-primary">{userData.credits.remaining}</span>
                    </p>
                    <p className="text-base mb-2 pb-4 pt-2 font-bold	">
                        Subscription Plan: <span className="text-primary">{userData.subscription.package?.name || "Free"}</span>
                    </p>
                    <div className="flex flex-row gap-4 justify-end">
                        <div className={`flex justify-center md:justify-end ${user?.role !== 'admin' && 'hidden'}`}>
                            <button disabled={!giftMembershipType} onClick={() => {
                                setGiftUserId(userData._id)
                                setShowGiftMembershipModal(true)
                            }} className={`${giftMembershipType === 'cancel' ? 'bg-danger' : 'bg-white'} ${giftMembershipType === 'cancel' ? 'white' : 'dark-blue-color'} rounded px-4 h-9 flex items-center justify-center text-lg font-bold rounded-lg`}>
                                {giftMembershipType === 'cancel' ? 'REVOKE GIFTED MEMBERSHIP' : 'GIFT MEMBERSHIP'}
                            </button>
                        </div>
                        <div className={`flex justify-center md:justify-end ${user?.role !== 'admin' && 'hidden'}`}>
                            <button onClick={() => {
                                setGiftUserId(userData._id)
                                setShowGiftModal(true)
                            }} className="bg-primary dark-blue-color rounded w-40 h-9 flex items-center justify-center text-lg font-bold rounded-lg hover-button-shadow">
                                GIFT CREDITS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <Metrics omitPlayerCard={true} playerId={userData._id} />
            </div>
        </div>
    );
}

const TrainerProfile = ({ setGiftUserId, setShowEditModal, setShowDeleteModal, setShowGiftModal, setShowGiftMembershipModal, giftMembershipType, setGiftMembershipType, userData }) => {

    const user = useSession().data?.user || {}

    useEffect(() => {
        if (!userData) return
        axios.get('/api/users/giftMembership/exists', { params: { userId: userData._id } }).then((res) => {
            if (res.data.subscription) setGiftMembershipType('cancel')
            else setGiftMembershipType('grant')
        }).catch(console.error)
    }, [userData])

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row max-w-4xl gap-4 p-8 rounded-2xl items-start" style={{ background: "linear-gradient(115.84deg, #32E100 -127.95%, #090F21 66.31%)", }} >
                <div>
                    <img
                        className="w-[304px] h-auto md:h-[429px] rounded-lg"
                        src={userData.avatarUrl || "/assets/player-large.png"}
                        alt={userData.name}
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                <div className="flex-1 w-full">
                    <div
                        className="flex flex-col md:flex-row justify-between items-center mb-2 rounded-lg p-4 gap-4"
                        style={{ background: "#32E1004D", padding: "11px 12px" }}
                    >
                        <h2 className="text-2xl md:text-4xl font-normal">{userData.name}</h2>
                        <div className={`flex gap-4 ${user.role !== 'admin' && 'hidden'}`}>
                            <button onClick={() => setShowEditModal(true)} className="bg-white flex justify-center items-center w-8 h-8 md:w-12 md:h-12 text-green-600 rounded-lg p-2 focus:outline-none">
                                <img src="/assets/edit-icon.svg" alt="" />
                            </button>
                            <button onClick={() => setShowDeleteModal(true)} className="button-danger flex justify-center items-center w-8 h-8 md:w-12 md:h-12 rounded-lg p-2 focus:outline-none">
                                <img src="/assets/delete-icon-white.svg" alt="" />
                            </button>
                        </div>
                    </div>
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Email: <span className="font-normal">{userData.email}</span>
                    </p>
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Joining Date: <span className="text-primary">{new Date(userData.creationDate).toLocaleDateString()}</span>
                    </p>
                    {/* <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Expiry Date: <span className="text-primary">{(userData.subscription.currentPeriodEnd && new Date(userData.subscription.currentPeriodEnd).toLocaleDateString()) || 'N/A'}</span>
                    </p> */}
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Remaining Credits: <span className="text-primary">{userData.credits.remaining}</span>
                    </p>
                    <p className="text-base mb-2 pb-4 pt-2 font-bold	">
                        Subscription Plan: <span className="text-primary">{userData.subscription.package?.name || 'Free'}</span>
                    </p>
                    <div className="flex flex-row gap-4 justify-end">
                        <div className={`flex justify-center md:justify-end ${user?.role !== 'admin' && 'hidden'}`}>
                            <button disabled={!giftMembershipType} onClick={() => {
                                setGiftUserId(userData._id)
                                setShowGiftMembershipModal(true)
                            }} className={`${giftMembershipType === 'cancel' ? 'bg-danger' : 'bg-white'} ${giftMembershipType === 'cancel' ? 'white' : 'dark-blue-color'} rounded px-4 h-9 flex items-center justify-center text-lg font-bold rounded-lg`}>
                                {giftMembershipType === 'cancel' ? 'REVOKE GIFTED MEMBERSHIP' : 'GIFT MEMBERSHIP'}
                            </button>
                        </div>
                        <div className={`flex justify-center md:justify-end ${user?.role !== 'admin' && 'hidden'}`}>
                            <button onClick={() => {
                                setGiftUserId(userData._id)
                                setShowGiftModal(true)
                            }} className="bg-primary dark-blue-color rounded w-40 h-9 flex items-center justify-center text-lg font-bold rounded-lg hover-button-shadow">
                                GIFT CREDITS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <h3>Videos Uploaded</h3>
            </div>
            <div>
                <History omitHeader trainerId={userData._id} />
            </div>
            <div>
                <h3>Players</h3>
            </div>
            <div className="-mt-8">
                <PlayersHistory omitHeader trainerId={userData._id} />
            </div>
        </div>
    );
}

const StaffProfile = ({ setShowEditModal, setShowDeleteModal, userData }) => {

    const user = useSession().data?.user || {}

    return (
        <div>
            <div className="flex-col lg:flex-row gap-4 max-w-4xl p-8 rounded-2xl flex items-start" style={{ background: "linear-gradient(115.84deg, #32E100 -127.95%, #090F21 66.31%)", }} >
                <div>
                    <img
                        className="w-[304px] h-[180px] md:h-[429px] rounded-lg"
                        src={userData.avatarUrl || "/assets/player-large.png"}
                        alt={userData.name}
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                <div className="flex-1 w-full">
                    <div
                        className="flex flex-col md:flex-row justify-between items-center mb-2 rounded-lg p-4 gap-4"
                        style={{ background: "#32E1004D", padding: "11px 12px" }}
                    >
                        <h2 className="text-2xl md:text-4xl font-normal">{userData.name}</h2>
                        <div className={`flex gap-4 ${user.role !== 'admin' && 'hidden'}`}>
                            <button onClick={() => setShowEditModal(true)} className="bg-white flex justify-center items-center w-8 h-8 md:w-12 md:h-12 text-green-600 rounded-lg p-2 focus:outline-none">
                                <img src="/assets/edit-icon.svg" alt="" />
                            </button>
                            <button onClick={() => setShowDeleteModal(true)} className="button-danger flex justify-center items-center w-8 h-8 md:w-12 md:h-12 rounded-lg p-2 focus:outline-none">
                                <img src="/assets/delete-icon-white.svg" alt="" />
                            </button>
                        </div>
                    </div>
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Email: <span className="font-normal">{userData.email}</span>
                    </p>
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Joining Date: <span className="text-primary">{new Date(userData.creationDate).toLocaleDateString()}</span>
                    </p>
                    {/* <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Expiry Date: <span className="text-primary">{(userData.subscription.currentPeriodEnd && new Date(userData.subscription.currentPeriodEnd).toLocaleDateString()) || 'N/A'}</span>
                    </p>
                    <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                        Remaining Credits: <span className="text-primary">{userData.credits.remaining}</span>
                    </p>
                    <p className="text-base mb-2 pb-4 pt-2 font-bold">
                        Subscription Plan: <span className="text-primary">{userData.subscription.package?.name || 'N/A'}</span>
                    </p> */}
                    {/* <div className="flex justify-end">
                        <button className="bg-primary dark-blue-color rounded w-40 h-9 flex items-center justify-center text-lg font-bold rounded-lg">
                            VIEW UPLOADS
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

const UserProfile = () => {
    const router = useRouter()
    const searchParams = useSearchParams()

    const role = searchParams.get('role')
    const userId = searchParams.get('id');
    const [userData, setUserData] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showGiftModal, setShowGiftModal] = useState(false)
    const [showGiftMembershipModal, setShowGiftMembershipModal] = useState(false)
    const [giftUserId, setGiftUserId] = useState(false)
    const [giftMembershipType, setGiftMembershipType] = useState('')

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        try {
            const response = await axios.get(`/api/users`, { params: { id: userId } });
            setUserData(response.data[0]);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    };

    return (

        <div className="flex flex-col mt-10 gap-10">
            <div className="w-fit border primary-border-parrot rounded">
                <IconButton onClick={() => router.back()}>
                    <img src="/assets/back-icon.svg" />
                </IconButton>
            </div>
            <div>
                {!userData ? <CircularProgress /> :
                    role === 'player' ? <PlayerProfile setGiftUserId={setGiftUserId} setShowEditModal={setShowEditModal} setShowDeleteModal={setShowDeleteModal} setShowGiftModal={setShowGiftModal} userData={userData} setShowGiftMembershipModal={setShowGiftMembershipModal} giftMembershipType={giftMembershipType} setGiftMembershipType={setGiftMembershipType} /> :
                        role === 'trainer' ? <TrainerProfile setGiftUserId={setGiftUserId} setShowEditModal={setShowEditModal} setShowDeleteModal={setShowDeleteModal} setShowGiftModal={setShowGiftModal} userData={userData} setShowGiftMembershipModal={setShowGiftMembershipModal} giftMembershipType={giftMembershipType} setGiftMembershipType={setGiftMembershipType} /> :
                            role === 'staff' ? <StaffProfile setShowEditModal={setShowEditModal} setShowDeleteModal={setShowDeleteModal} userData={userData} /> : <></>
                }
            </div>
            {userData &&
                <div>
                    {showEditModal && <EditUserModal open={showEditModal} onClose={() => setShowEditModal(false)} userData={userData} onSuccess={fetchUser} />}
                    <DeleteUserModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} userId={userId} onSuccess={() => router.back()} />
                    <GiftUserModal onSuccess={() => {
                        fetchUser()
                        setShowGiftModal(false)
                    }} userId={giftUserId} open={showGiftModal} onClose={() => setShowGiftModal(false)} />
                    <GiftMembershipModal onSuccess={() => {
                        fetchUser()
                        setShowGiftMembershipModal(false)
                    }} userId={giftUserId} type={giftMembershipType} open={showGiftMembershipModal} onClose={() => setShowGiftMembershipModal(false)} />
                </div>
            }
        </div>
    );
};

export default UserProfile;
