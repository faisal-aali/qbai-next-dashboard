import mongoose from "mongoose";

export interface ITicketMessage {
    ticketObjectId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    message: string;
    attachments: string[];
    viewedBy: string[];
    creationDate: Date;
}