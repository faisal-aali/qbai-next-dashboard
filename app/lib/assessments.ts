import motionAPI from "./3motion";
import { IVideo } from "./interfaces/video";
import { Notification, User, Video } from "./models";
import { sendEmail } from "./sendEmail";
import { PostVideoUpload } from "./zapier";
import { uploadFileToS3 } from "./aws";
import { srcUrlToBase64 } from "./functions";
import { IAssessmentDetailsNew } from "./interfaces/assessmentDetails";

const updateAssessment = async (videoId: string) => {
    try {
        const video = await Video.findOne({ _id: videoId })
        if (!video) throw new Error(`Invalid video id: ${videoId}`)
        if (video.motionApiVersion === 'legacy') throw new Error('Legacy motion API version no longer supported')

        const assessmentDetails = await motionAPI.getAssessmentDetails({ assessmentId: video.taskId });

        if (assessmentDetails.dataJsonUrl) {
            assessmentDetails.stats = await motionAPI.getAssessmentData({ dataJsonUrl: assessmentDetails.dataJsonUrl })
        }

        const bucket = process.env.AWS_BUCKET_3MOTION

        let s3FileUrl = video.assessmentDetails.s3FileUrl
        if (!s3FileUrl && assessmentDetails.fileUrl) {
            const base64 = await srcUrlToBase64(assessmentDetails.fileUrl)
            s3FileUrl = await uploadFileToS3(base64, `${process.env.ENVIRONMENT}/original_video_${video._id}.mp4`, 1, false, bucket, 'video/mp4')
        }

        let s3DataJsonUrl = video.assessmentDetails.s3DataJsonUrl
        if (!s3DataJsonUrl && assessmentDetails.dataJsonUrl) {
            const base64 = await srcUrlToBase64(assessmentDetails.dataJsonUrl)
            s3DataJsonUrl = await uploadFileToS3(base64, `${process.env.ENVIRONMENT}/data_json_${video._id}.json`, 1, false, bucket, 'application/json')
        }

        let s3PdfUrl = video.assessmentDetails.s3PdfUrl
        if (!s3PdfUrl && assessmentDetails.pdfUrl) {
            const base64 = await srcUrlToBase64(assessmentDetails.pdfUrl)
            s3PdfUrl = await uploadFileToS3(base64, `${process.env.ENVIRONMENT}/report_pdf_${video._id}.pdf`, 1, false, bucket, 'application/pdf')
        }

        let s3OverlayUrl = video.assessmentDetails.s3OverlayUrl
        if (!s3OverlayUrl && assessmentDetails.overlayUrl) {
            const base64 = await srcUrlToBase64(assessmentDetails.overlayUrl)
            s3OverlayUrl = await uploadFileToS3(base64, `${process.env.ENVIRONMENT}/overlay_video_${video._id}.mp4`, 1, false, bucket, 'video/mp4')
        }

        video.assessmentDetails = assessmentDetails
        video.assessmentDetails.s3FileUrl = s3FileUrl
        video.assessmentDetails.s3DataJsonUrl = s3DataJsonUrl
        video.assessmentDetails.s3PdfUrl = s3PdfUrl
        video.assessmentDetails.s3OverlayUrl = s3OverlayUrl

        await video.save()

        return assessmentDetails;
    } catch (error) {
        // Check if it's a network error or timeout
        const isNetworkError = error instanceof Error && (
            error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('ETIMEDOUT')
        );

        if (isNetworkError) {
            console.log('[updateAssessment] Network error occurred, retrying...');
            // Wait for 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
            return updateAssessment(videoId);
        }

        throw error;
    }
}

const updateAssessments = async () => {
    try {
        console.log('[updateAssessments] starting')
        const videos = await Video.find({
            $or: [
                { "assessmentDetails.statusCode": { $exists: false } },
                { "assessmentDetails.statusCode": "InProgress" },
                { "assessmentDetails.overlayUrl": null }
            ],
            motionApiVersion: 'core'
        });
        if (videos.length === 0) return console.log('[updateAssessments] no videos to update')
        videos.forEach(async video => {
            console.log('[updateAssessments] updating pending assessment details for', video.taskId)

            const assessmentDetails = await updateAssessment(video._id)

            if (assessmentDetails.statusCode === 'Completed') {
                sendNotification(video, assessmentDetails.statusCode)
            }

            if (assessmentDetails.statusCode === 'Completed') {
                PostVideoUpload(video._id).catch(err => console.error('[Zapier] FATAL ERROR:', err))
            }

            console.log('[updateAssessments] updated assessment details for', video.taskId)
        })
    } catch (err) {
        console.error('[updateAssessments] unexpected error:', err)
    }
}

const sendNotification = async (_video: IVideo, statusCode: 'InProgress' | 'Completed') => {
    try {
        if (!statusCode) return console.error('[sendNotification] Invalid status code', statusCode)
        const video = await Video.findOne({ _id: _video._id })
        if (!video) return console.error('[sendNotification] error: could not find video')

        const user = await User.findOne({ _id: video.userId })
        if (!user) return console.error('[sendNotification] error: could not find user')

        var trainer;

        if (user.roleData.trainerId) {
            trainer = await User.findOne({ _id: user.roleData.trainerId })
            if (!trainer) return console.error('[sendNotification] error: could not find trainer')
        }

        const success = statusCode === 'Completed';

        Notification.create({ message: success ? 'Your video has been processed!' : 'Sorry, your video has failed to process', userId: user._id, type: 'video' })
        if (trainer) Notification.create({ message: success ? 'Your player\'s video has been processed!' : 'Sorry, your player\'s video has failed to process', userId: trainer._id, type: 'video' })

        const email = {
            subject: success ? 'Processing Completed' : 'Processing Failed',
            html: `
                    <p>Hello, ${user.name}!</p>
                    <p>${success ? 'Your video processing has been finished.' : 'Something went wrong, your video has failed to process.'}</p>
                `
        }

        sendEmail({
            to: user.email,
            ...email
        }).catch(console.error)


        if (trainer) {
            sendEmail({
                to: trainer.email,
                ...email
            }).catch(console.error)
        }

    } catch (err) {
        console.error('[sendNotification] unexpected error:', err)
    }
}

export { updateAssessments, sendNotification, updateAssessment }
