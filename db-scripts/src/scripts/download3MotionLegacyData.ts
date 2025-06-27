import dotenv from "dotenv"
dotenv.config()
import db from "../modules/db";
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import mongoose, { Mongoose } from "mongoose";
const targetDB = db.prod

async function download3MotionLegacyData() {
    const accessToken = await getAuthToken()

    const videos = await db.prod.collection('videos').find({
        assessmentDetails: { $exists: true },
        // _id: new mongoose.Types.ObjectId('6744e17efd02a4b627b86c08') 
    }).toArray()

    console.log(`getting ${videos.length} videos data`)

    await Promise.all(videos.map(async (video: any) => {
        const existingFile = fs.existsSync(path.join(__dirname, `./motion_legacy_data/${video._id}/original_video_${video._id}.mp4`))
        const existingData = fs.existsSync(path.join(__dirname, `./motion_legacy_data/${video._id}/data_${video._id}.json`))
        const existingReport = fs.existsSync(path.join(__dirname, `./motion_legacy_data/${video._id}/report_${video._id}.pdf`))
        const existingOverlay = fs.existsSync(path.join(__dirname, `./motion_legacy_data/${video._id}/overlay_video_${video._id}.mp4`))

        if (existingFile && existingData && existingReport && existingOverlay) {
            console.log(`video data for ${video._id} already exists`)
            return
        }

        console.log(`getting video data for ${video._id}`)

        const data = await getAssessmentDetails(video.taskId, accessToken)
        const { fileUrl, dataJsonUrl, reportPdfUrl, overlayVideoUrl } = data

        fs.mkdirSync(path.join(__dirname, `./motion_legacy_data/${video._id}`), { recursive: true })


        if (!existingFile) {
            console.log(`getting file for ${video._id}`)
            const file = await axios.get(fileUrl, {
                responseType: 'arraybuffer'
            })
            fs.writeFileSync(path.join(__dirname, `./motion_legacy_data/${video._id}/original_video_${video._id}.mp4`), file.data)
        }

        if (!existingData) {
            console.log(`getting dataJson for ${video._id}`)
            const dataJson = await axios.get(dataJsonUrl, {
                responseType: 'arraybuffer'
            })
            fs.writeFileSync(path.join(__dirname, `./motion_legacy_data/${video._id}/data_${video._id}.json`), dataJson.data)
        }

        if (!existingReport) {
            console.log(`getting reportPdf for ${video._id}`)
            const reportPdf = await axios.get(reportPdfUrl, {
                responseType: 'arraybuffer'
            })
            fs.writeFileSync(path.join(__dirname, `./motion_legacy_data/${video._id}/report_${video._id}.pdf`), reportPdf.data)
        }

        if (!existingOverlay) {
            console.log(`getting overlayVideo for ${video._id}`)
            const overlayVideo = await axios.get(overlayVideoUrl, {
                responseType: 'arraybuffer'
            })
            fs.writeFileSync(path.join(__dirname, `./motion_legacy_data/${video._id}/overlay_video_${video._id}.mp4`), overlayVideo.data)
        }

        console.log(`saved video data for ${video._id}`)
    }
    ))

    console.log(`successfully saved ${videos.length} videos data`)
}

const getAuthToken = async () => {
    const res = await axios.post("https://3m.3motionai.com/api/v1/Account/Authenticate", {
        "usernameOrEmailAddress": process.env.MOTION_API_EMAIL_LEGACY,
        "password": process.env.MOTION_API_PASSWORD_LEGACY,
    })

    return res.data.result.accessToken
}

const getAssessmentDetails = async (taskId: string, accessToken: string) => {
    const res = await axios.get(`https://3m.3motionai.com/api/v1/Assessment/GetAssessmentDetails?taskId=${taskId}&taskType=qbthrow`, {
        params: {
            taskId,
            taskType: 'qbthrow'
        },
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    return res.data.result
}

targetDB.on('open', () => {
    console.log('connected to target db')
    download3MotionLegacyData()
})
