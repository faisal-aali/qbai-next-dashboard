import mongoose from "mongoose";

export interface ITicket {
    _id: string,
    ticketId: string,
    userId: mongoose.Schema.Types.ObjectId,
    // message: string, @deprecated
    // attachments: string[], @deprecated
    // viewedBy: string[], @deprecated
    status: 'open' | 'closed',
    // comment: string | null, @deprecated
    closedBy: mongoose.Schema.Types.ObjectId | null,
    platform: 'web' | 'app',
    closingDate: Date,
    creationDate: Date
}