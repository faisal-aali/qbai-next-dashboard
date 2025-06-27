"use client"

import { useEffect, useState } from 'react';
import axios from 'axios'
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import AddPromocodeModal from '../AddPromocodeModal/AddPromocodeModal';
import DeletePromocodeModal from '../DeletePromocodeModal/DeletePromocodeModal';
import { useApp } from '@/components/Context/AppContext';


const Promocode = ({ promocode, setDeletePromo, showSnackbar, fetchData }) => {
    const [handlingPopup, setHandlingPopup] = useState(false)

    const handleShowPopup = (showPopup) => {
        setHandlingPopup(true)
        axios.patch('/api/promocodes/' + promocode._id, { showPopup })
            .then(() => {
                showSnackbar('Promo code has been updated!', 'success')
                fetchData()
            }).catch(err => {
                showSnackbar(err?.response?.data?.message || err?.message || 'Unexpected error occured', 'error')
            }).finally(() => setHandlingPopup(false))
    }

    return (
        <div className="blueBackground w-full md:w-fit p-4 primary-border rounded-lg flex items-start justify-between gap-4">
            <div className="flex w-full flex-col gap-4">
                <div className='flex justify-between gap-4'>
                    <p className="text-lg font-bold text-primary md:text-2xl font-normal">
                        {promocode.code}
                    </p>
                    <button
                        onClick={() => setDeletePromo(promocode._id)}
                        className="button-danger flex justify-center items-center w-8 h-8 rounded p-2 focus:outline-none"
                    >
                        <img src="/assets/delete-icon-white.svg" alt="" />
                    </button>
                </div>
                <p className="text-base md:text-md font-normal">
                    {promocode.description}
                </p>
                <div className='flex flex-col gap-1'>
                    <div>
                        <p className="text-sm md:text-lg font-normal">
                            Type: {promocode.type === 'purchase_discount' && 'Credits Purchase Discount' || promocode.type === 'free_credits' && 'Free Credits'}
                        </p>
                    </div>
                    <div className={`${promocode.type !== 'purchase_discount' && 'hidden'}`}>
                        <p className={`text-sm md:text-lg font-normal`}>
                            Discount: {promocode.discountPercentage}%
                        </p>
                    </div>
                    <div className={`${promocode.type !== 'free_credits' && 'hidden'}`}>
                        <p className={`text-sm md:text-lg font-normal`}>
                            Credits: {promocode.claimCredits}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm md:text-lg font-normal">
                            Uses: {promocode.products.length}/{promocode.uses}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm md:text-lg font-normal">
                            Expires On: {new Date(promocode.expirationDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div className={`flex gap-2 items-center ${(promocode.products.length >= promocode.uses || new Date(promocode.expirationDate).getTime() < new Date().getTime()) && 'hidden'}`}>
                        <div>
                            <Checkbox disabled={handlingPopup} checked={promocode.showPopup} sx={{ width: 20, color: 'white' }} onChange={(e) => handleShowPopup(e.target.checked)} />
                        </div>
                        <div>
                            <label htmlFor="" className={handlingPopup && 'opacity-45'}>Show in Popup</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Promocodes() {

    const { showSnackbar } = useApp()
    const [tabIndex, setTabIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [deletePromo, setDeletePromo] = useState()

    const [promocodes, setPromocodes] = useState()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        axios.get('/api/promocodes').then(res => {
            setPromocodes(res.data)
        }).catch(console.error)
    }

    const filteredPromocodes = !promocodes ? undefined : tabIndex === 0 && promocodes.filter(promo => !searchQuery ? true : (promo.code.toLowerCase().match(searchQuery) || promo.description.toLowerCase().match(searchQuery))) ||
        tabIndex === 1 && promocodes.filter(code => code.products.length < code.uses && new Date(code.expirationDate).getTime() > new Date().getTime()) ||
        tabIndex === 2 && promocodes.filter(code => code.products.length >= code.uses) ||
        tabIndex === 3 && promocodes.filter(code => code.products.length < code.uses && new Date(code.expirationDate).getTime() < new Date().getTime()) || []

    return (
        <div className="flex-1">
            <div className="blueBackground p-4 primary-border rounded-lg flex items-center justify-between mb-4 h-32 w-full xl:w-3/5">
                <div className="flex gap-5 items-center">
                    <div className="ml-4">
                        <h2 className="text-2xl md:text-4xl font-normal">
                            Promo codes
                        </h2>
                    </div>
                </div>
            </div>
            <div className="rounded-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full justify-between">
                    <Tabs
                        value={tabIndex}
                        onChange={(e, v) => setTabIndex(v)}
                        indicatorColor="none"
                        textColor="inherit"
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="category tabs"
                        className="!blueBackground py-2.5 !px-2.5 rounded-lg"
                        sx={{
                            color: "white",
                            ".MuiButtonBase-root.MuiTab-root": {
                                minHeight: "40px",
                                backgroundColor: "#32E10026",
                                borderRadius: "6px",
                                fontWeight: 500,
                                fontSize: "15px",
                                textTransform: "capitalize",
                                padding: "10px",
                            },
                            ".MuiTabs-flexContainer": {
                                justifyContent: "space-around",
                                gap: "10px",
                            },
                            ".MuiButtonBase-root.MuiTab-root.Mui-selected": {
                                color: "#090F21",
                                backgroundColor: "#32E100",
                            },
                            ".MuiButtonBase-root.MuiTabScrollButton-root": {
                                width: 20,
                            },
                        }}
                    >
                        {['All', 'Available', 'Used', 'Expired'].map((name, index) => (
                            <Tab
                                key={index}
                                label={name}
                                value={index}
                                sx={{
                                    color: "#ffffff",
                                    "&.Mui-selected": {
                                        color: "#000000",
                                    },
                                }}
                            />
                        ))}
                    </Tabs>
                    <div className="flex flex-col md:flex-row justify-end gap-[30px] w-full md:w-fit">
                        <div className="flex search-bar w-full md:w-[200px] 4xl:w-[580px] ">
                            <input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setTabIndex(0)
                                    setSearchQuery(e.target.value)
                                }}
                                className="w-full py-1 rounded-lg text-white h-12 search-background focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div className={`flex justify-center`}>
                            <button
                                className="bg-white dark-blue-color rounded w-44 h-14 flex items-center justify-center text-lg rounded-lg"
                                onClick={() => setShowAddModal(true)}
                            >
                                ADD NEW CODE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex flex-row flex-wrap mt-4 gap-4'>
                {!filteredPromocodes ? <CircularProgress /> :
                    filteredPromocodes.length === 0 ? <p>No promo codes available</p> :
                        filteredPromocodes.map(promocode => <Promocode promocode={promocode} setDeletePromo={setDeletePromo} showSnackbar={showSnackbar} fetchData={fetchData} />)}
            </div>
            <AddPromocodeModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
            <DeletePromocodeModal open={deletePromo ? true : false} onClose={() => setDeletePromo()} promocodeId={deletePromo} onSuccess={fetchData} />
        </div>
    )
}