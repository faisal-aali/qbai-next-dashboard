import mongoose from "mongoose";

export interface IRequest {
    _id: string,
    userId: mongoose.Schema.Types.ObjectId,
    requestType: string,
    entityId: string,
    reason: string,
    isViewed: boolean,
    action: string,
    creationDate: Date
}