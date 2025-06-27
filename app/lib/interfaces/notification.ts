import mongoose from "../mongodb";

export interface INotification {
    _id: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    message: string,
    type: string,
    isRead: boolean,
    creationDate: Date
}