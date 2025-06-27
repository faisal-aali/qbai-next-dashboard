import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Promocode, Purchase, User, Request, Ticket, TicketMessage } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        var session;
        const authHeader = headers().get("authorization")
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as IUser;
            if (!user._id) throw Error('Malformed JWT');
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const query: { userId?: mongoose.Types.ObjectId } = {};
        if (session.user.role !== 'admin') query.userId = new mongoose.Types.ObjectId(session.user._id.toString());

        const tickets = await Ticket.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        { $project: { name: 1, _id: 1, avatarUrl: 1 } }
                    ],
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { creationDate: -1 }
            }
        ])

        return NextResponse.json(tickets)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}

export async function POST(req: NextRequest) {
    try {
        var session;
        const authHeader = headers().get("authorization")
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as Partial<IUser>;
            if (!user._id) throw Error('Malformed JWT');
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user || !session.user.role) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        if (!['player', 'trainer', 'staff'].includes(session.user.role)) return NextResponse.json({ message: 'Cannot access this resource' }, { status: 403 })

        const data = await req.json()

        const schema = Yup.object({
            // userId: Yup.string().required("User Id is required"),
            message: Yup.string().required("Message is required"),
            attachments: Yup.array().required("Attachment(s) is required"),
            platform: Yup.string().oneOf(['web', 'app']).required("Platform is required")
        });

        await schema.validate(data)

        const ticket = await Ticket.create({
            userId: session.user._id,
            // message: data.message,
            // attachments: data.attachments,
            platform: data.platform,
            ticketId: 'interim'
        })

        try {
            await TicketMessage.create({
                ticketObjectId: ticket._id,
                userId: session.user._id,
                message: data.message,
                attachments: data.attachments,
                viewedBy: [session.user._id?.toString()]
            })
        } catch (err: unknown) {
            console.error(err)
            await Ticket.deleteOne({ _id: ticket._id })
            throw err
        }

        return NextResponse.json({ message: `Ticket has been created with id ${ticket.ticketId}` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}