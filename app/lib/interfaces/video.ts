import { IAssessmentDetails, IAssessmentDetailsNew } from "./assessmentDetails";

export interface IVideo {
    _id: string,
    userId: string,
    uploadedBy: string,
    thumbnailUrl: string | null,
    taskId: string,
    assessmentMappingId: string,
    taskType: string,
    deliveryDate: Date,
    creationDate: Date,
    assessmentDetails: IAssessmentDetails | IAssessmentDetailsNew,
    framerate: number,
    isDeleted: boolean,
    motionApiVersion: 'legacy' | 'core'
}