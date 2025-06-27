// src/components/History/History.js
"use client";
import { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import axios from 'axios'

const UpdateCalendar = () => {
    const [calendar, setCalendar] = useState()
    const [src, setSrc] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        axios.get('/api/calendar').then(res => {
            setCalendar(res.data)
            setSrc(res.data.src)
        })
    }

    const handleSubmit = () => {
        setIsSubmitting(true)
        axios.patch('/api/calendar', { src }).then(() => {
            // setSrc('')
        }).finally(() => {
            fetchData()
            setIsSubmitting(false)
        })
    }

    return (
        !calendar ? <CircularProgress /> :
            <div className="flex flex-col gap-8">
                <div className="blueBackground p-4 primary-border rounded-lg flex items-center justify-between mb-4 h-32 w-full xl:w-3/5">
                    <div className="flex gap-5 items-center">
                        <div className="ml-4">
                            <h2 className="font-normal">Update Calendar</h2>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row gap-4">
                    <div className="w-1/2">
                        <input
                            type='text'
                            placeholder="Update Iframe Source"
                            value={src}
                            onChange={e => setSrc(e.target.value)}
                            className={`py-3 px-3 blueBackground rounded-lg w-full text-primary focus:outline-none placeholder:opacity-45}`}
                        />
                    </div>
                    <div className="w-1/5">
                        <button
                            onClick={handleSubmit}
                            disabled={!src || isSubmitting}
                            className="bg-primary rounded-lg w-24 text-black font-semibold	 py-3 hover-shadow focus:outline-none"
                        >
                            Save
                        </button>
                    </div>
                </div>
                <div className='overflow-auto'>
                    <iframe className='w-full' src={calendar.src} height={800} />
                </div>
            </div>
    );
};

export default UpdateCalendar;
