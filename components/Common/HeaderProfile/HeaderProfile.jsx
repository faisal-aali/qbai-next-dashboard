import { useSession, } from "next-auth/react"
import axios from 'axios'
import { useState, useEffect } from "react"
import { convertCmToFeetAndInches } from "@/util/utils"
import CircularProgress from "@mui/material/CircularProgress"
import { useApp } from "@/components/Context/AppContext"

export default function HeaderProfile() {
    const userSession = useSession().data?.user || {}
    const { user } = useApp()

    return (
        !user ? <CircularProgress /> :
            <div className="flex flex-col md:flex-row  blueBackground p-4 primary-border rounded-lg flex items-center justify-center md:justify-between mb-0 md:mb-4 h-32 w-full xl:w-3/5">
                <div className="flex gap-5 items-center">
                    <img src="/assets/hello-icon.png" className="w-11" alt="" />
                    <div>
                        <h2 className="text-sm md:text-4xl font-normal">
                            Hello <span className="font-semibold capitalize">{user.name.split(' ')[0]}</span>
                        </h2>
                        <p className={`text-zinc-400 text-sm ${(userSession.role === 'staff' || userSession.role === 'admin') && 'hidden'}`}>
                            Credits Available: <span className="text-primary">{user?.credits.remaining}</span>
                        </p>
                    </div>
                </div>
                <div className={`flex space-x-4 ${(userSession.role !== 'player') && 'hidden'}`}>
                    <div className="primary-border-green flex items-center justify-center px-4 h-9 rounded-lg">
                        <p className="text-white text-sm">{convertCmToFeetAndInches(user?.roleData.height).string}</p>
                    </div>
                    <div className="primary-border-green flex items-center justify-center px-4 h-9 rounded-lg">
                        <p className="text-white text-sm">{user?.roleData.weight} lbs</p>
                    </div>
                </div>
            </div>
    )
}