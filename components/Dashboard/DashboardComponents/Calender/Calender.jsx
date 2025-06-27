"use client"

import { useState } from 'react';

export default function Calender() {
    const [calendar, setCalendar] = useState()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        axios.get('/api/calendar').then(res => {
            setCalendar(res.data)
            setSrc(res.data.src)
        })
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="blueBackground p-4 primary-border rounded-lg flex items-center justify-between mb-4 h-32 w-full xl:w-3/5">
                <div className="flex gap-5 items-center">
                    <div className="ml-4">
                        <h2 className="font-normal">Your Calendar</h2>
                    </div>
                </div>
            </div>
            <div className='overflow-auto'>
                <iframe className='w-full' src={calendar.src} height={800} />
            </div>
        </div>
    )
}