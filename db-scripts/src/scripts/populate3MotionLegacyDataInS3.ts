import dotenv from "dotenv"
dotenv.config()
import db from "../modules/db";
import axios from 'axios'
import { checkIfFileExistsInS3, uploadFileToS3 } from "../modules/aws";
import pLimit from 'p-limit'
import mongoose from 'mongoose'

const limit = pLimit(3)
const targetDB = db.prod

const bucket = 'qb-ai-3motion-data'

async function populate3MotionLegacyDataInS3() {

    const accessToken = await getAuthToken()

    const videos = await targetDB.collection('videos').find({
        assessmentDetails: { $exists: true },
        motionApiVersion: 'legacy',
        // _id: new mongoose.Types.ObjectId('6760b16b142c42b1086f1005')
    }).toArray()

    console.log(`getting ${videos.length} videos data`)

    const progressTotal = videos.length
    let progressCount = 0

    await Promise.all(videos.map((video: any) => limit(() => processVideo(video, accessToken).then(() => {
        progressCount++
        console.log(`progress: ${progressCount}/${progressTotal} (${Math.round((progressCount / progressTotal) * 100)}%)`)
    }))))

    console.log(`successfully saved ${videos.length} videos data`)
}

const processVideo = async (video: any, accessToken: string) => {
    // s3FileUrl?: string | null;
    // s3DataJsonUrl?: string | null;
    // s3PdfUrl?: string | null;
    // s3OverlayUrl?: string | null;

    let s3FileUrl = video.assessmentDetails.s3FileUrl
    let s3DataJsonUrl = video.assessmentDetails.s3DataJsonUrl
    let s3PdfUrl = video.assessmentDetails.s3PdfUrl
    let s3OverlayUrl = video.assessmentDetails.s3OverlayUrl

    if (s3FileUrl && s3DataJsonUrl && s3PdfUrl && s3OverlayUrl) {
        console.log(`video data for ${video._id} already exists`)
        return
    }

    console.log(`getting video data for ${video._id}`)

    const data = await getAssessmentDetails(video.taskId, accessToken)
    const { fileUrl, dataJsonUrl, reportPdfUrl, overlayVideoUrl } = data

    if (!s3FileUrl && fileUrl) {
        const key = `${process.env.ENVIRONMENT}/original_video_${video._id}.mp4`
        const url = await checkIfFileExistsInS3(bucket, key)
        if (url) {
            console.log(`original video already exists in s3 for video ${video._id}`)
            s3FileUrl = url
        } else {
            console.log(`getting original video from 3motion for video ${video._id}`)
            const base64 = await srcUrlToBase64(fileUrl)
            console.log(`uploading original video to s3 for video ${video._id}`)
            s3FileUrl = await uploadFileToS3(base64, key, 1, false, bucket, 'video/mp4')
        }
    }

    if (!s3DataJsonUrl && dataJsonUrl) {
        const key = `${process.env.ENVIRONMENT}/data_json_${video._id}.json`
        const url = await checkIfFileExistsInS3(bucket, key)
        if (url) {
            console.log(`data json already exists in s3 for video ${video._id}`)
            s3DataJsonUrl = url
        } else {
            console.log(`getting data json from 3motion for video ${video._id}`)
            const base64 = await srcUrlToBase64(dataJsonUrl)
            console.log(`uploading data json to s3 for video ${video._id}`)
            s3DataJsonUrl = await uploadFileToS3(base64, key, 1, false, bucket, 'application/json')
        }
    }

    if (!s3PdfUrl && reportPdfUrl) {
        const key = `${process.env.ENVIRONMENT}/report_pdf_${video._id}.pdf`
        const url = await checkIfFileExistsInS3(bucket, key)
        if (url) {
            console.log(`report pdf already exists in s3 for video ${video._id}`)
            s3PdfUrl = url
        } else {
            console.log(`getting report pdf from 3motion for video ${video._id}`)
            const base64 = await srcUrlToBase64(reportPdfUrl)
            console.log(`uploading report pdf to s3 for video ${video._id}`)
            s3PdfUrl = await uploadFileToS3(base64, key, 1, false, bucket, 'application/pdf')
        }
    }

    if (!s3OverlayUrl && overlayVideoUrl) {
        const key = `${process.env.ENVIRONMENT}/overlay_video_${video._id}.mp4`
        const url = await checkIfFileExistsInS3(bucket, key)
        if (url) {
            console.log(`overlay video already exists in s3 for video ${video._id}`)
            s3OverlayUrl = url
        } else {
            console.log(`getting overlay video from 3motion for video ${video._id}`)
            const base64 = await srcUrlToBase64(overlayVideoUrl)
            console.log(`uploading overlay video to s3 for video ${video._id}`)
            s3OverlayUrl = await uploadFileToS3(base64, key, 1, false, bucket, 'video/mp4')
        }
    }

    video.assessmentDetails.s3FileUrl = s3FileUrl
    video.assessmentDetails.s3DataJsonUrl = s3DataJsonUrl
    video.assessmentDetails.s3PdfUrl = s3PdfUrl
    video.assessmentDetails.s3OverlayUrl = s3OverlayUrl

    await targetDB.collection('videos').updateOne({ _id: video._id }, { $set: { 'assessmentDetails': video.assessmentDetails } })

    console.log(`saved video data for ${video._id}`)
}

const getAuthToken = async () => {
    console.log('getting auth token')
    console.log(process.env.MOTION_API_EMAIL_LEGACY, process.env.MOTION_API_PASSWORD_LEGACY)
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


async function srcUrlToBase64(srcUrl: string) {
    const response = await axios.get(srcUrl, { responseType: 'arraybuffer' })
    return Buffer.from(response.data).toString('base64')
}

targetDB.on('open', () => {
    console.log('connected to target db')
    populate3MotionLegacyDataInS3()
})
