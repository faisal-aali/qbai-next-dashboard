"use client"

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios'
import CircularProgress from '@mui/material/CircularProgress';

export default function CoachingCall() {
    const user = useSession().data?.user || {}

    const [calendar, setCalendar] = useState()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        axios.get('/api/calendar').then(res => {
            setCalendar(res.data)
        }).catch(console.error)
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="blueBackground p-4 primary-border rounded-lg flex items-center justify-between mb-4 h-32 w-full xl:w-3/5">
                <div className="flex gap-5 items-center">
                    <div className="ml-4">
                        <h2 className="text-xl md:text-4xl font-normal">{user.role === 'player' ? 'Schedule your Call with a Coach' : 'Your Calendar'}</h2>
                    </div>
                </div>
            </div>
            {!calendar ? <CircularProgress /> :
                <div className='overflow-auto'>
                    <iframe className='w-full mt-[-4rem]' src={calendar.src} height={800} />
                </div>}
        </div>
    )
}