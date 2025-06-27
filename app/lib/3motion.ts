import axios from 'axios';
import { IAssessmentData, IAssessmentDetailsNew } from './interfaces/assessmentDetails';

const api = axios.create({
    baseURL: process.env.MOTION_API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'X-API-KEY': process.env.MOTION_API_KEY
    }
})

class MotionAPI {

    public async getAssessments(): Promise<{ totalCount: number, items: IAssessmentDetailsNew[] }> {
        try {
            const { data }: { data: { totalCount: number, items: IAssessmentDetailsNew[] } } = await api.get('/app/assessments');

            return data;
        } catch (err: any) {
            console.error(err.response?.data)
            throw new Error(err.response?.data?.message || err.message || 'INTERNAL ERROR');
        }
    }

    public async getAssessmentDetails({ assessmentId }: { assessmentId: string | number }) {
        try {

            const { data }: { data: IAssessmentDetailsNew } = await api.get('/app/assessments/' + assessmentId);

            return data;
        } catch (err: any) {
            console.error(err.response?.data)
            throw new Error(err.response?.data?.message || err.message || 'INTERNAL ERROR');
        }
    }

    public async createAssessment({
        height,
        weight,
        file,
        frameRate,
        isBase64
    }: {
        height: number;
        weight: number;
        file: File | string;
        frameRate: number;
        isBase64: number;
    }) {
        try {
            var formData;

            if (isBase64) {
                formData = new (require('form-data'))()
            } else {
                formData = new FormData();
            }

            if (isBase64 && typeof file === 'string') {
                const base64Data = file.replace(/^data:.+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                formData.append('file', buffer, {
                    filename: 'video.mp4',  // File name that the API expects
                    contentType: 'video/mp4', // The MIME type for video
                });
            } else {
                formData.append('file', file);
            }

            const { data: uploadData }: { data: { id: string, notes: string | null, success: boolean } } = await api.post('/app/blobs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    console.log(`[3motion.createAssessment] uploaded ${percentCompleted}%`);
                },
            });

            if (!uploadData.success) {
                throw new Error('API error occured when uploading video');
            }

            console.log('[3motion.createAssessment] uploaded video to 3motion');

            const { data: assessmentData }: { data: { id: number } } = await api.post('/app/assessments', { assessmentTypeId: 3 })

            console.log('[3motion.createAssessment] created assessment with id', assessmentData.id);

            console.log('height', height);
            console.log('weight', weight);
            console.log('frameRate', frameRate);

            const { data: assessmentDetailData }: { data: { id: number, assessmentId: number } }
                = await api.post('/app/assessment-details', {
                    assessmentId: assessmentData.id,
                    assessmentMovementId: 38,
                    userHeight: height,
                    userWeight: weight,
                    mediaId: uploadData.id,
                    frameRate: frameRate
                })

            console.log('[3motion.createAssessment] processing assessment detail with id', assessmentDetailData.id);

            return assessmentDetailData;
        } catch (err: any) {
            console.error(err.response?.data)
            throw new Error(err.response?.data?.message || err.message || 'INTERNAL ERROR');
        }
    }

    public async getAssessmentData({ dataJsonUrl }: { dataJsonUrl: string }) {
        try {
            const { data }: { data: IAssessmentData } = await api.get(dataJsonUrl);

            data.ARR = null;
            data.ANG = null;
            data.VEL = null;

            return data;
        } catch (err: any) {
            console.error(err.response?.data)
            throw new Error(err.response?.data?.message || err.message || 'INTERNAL ERROR');
        }
    }
}

const motionAPI = new MotionAPI();
export default motionAPI;