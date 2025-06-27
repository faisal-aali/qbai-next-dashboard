import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Promocode, Purchase, User, Request, Ticket, TicketMessage } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../../auth/[...nextauth]/route";
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
        // if (session.user.role !== 'admin') return NextResponse.json({ message: 'Cannot access this resource' }, { status: 401 })

        // const query: any = {}
        // query.viewedBy = { $nin: [session.user._id.toString()] }
        // console.log('session.user.role', session.user.role)
        // if (session.user.role !== 'admin') {
        //     const userTickets = await Ticket.find({ userId: session.user._id }, { _id: 1 })
        //     console.log('userTickets', userTickets)
        //     query.ticketObjectId = { $in: userTickets.map(ticket => ticket._id) }
        // }

        // const unReadMessages = await TicketMessage.find(query)

        const unreadTickets = await Ticket.aggregate([
            {
                $match: {
                    userId: session.user.role === 'admin' ? { $exists: true } : new mongoose.Types.ObjectId(session.user._id.toString())
                }
            },
            {
                $lookup: {
                    from: "tickets_messages",
                    let: { ticketObjectId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$ticketObjectId", "$$ticketObjectId"] },
                                        { $not: { $in: [session.user._id.toString(), "$viewedBy"] } } // Only messages not viewed by user
                                    ]
                                }
                            }
                        },
                        {
                            $project: { _id: 1 } // Only need the message ID
                        }
                    ],
                    as: "unreadMessages"
                }
            },
            {
                $project: {
                    _id: 1,
                    unreadMessageIds: "$unreadMessages._id"
                }
            },
            {
                $match: {
                    "unreadMessageIds.0": { $exists: true } // Only include if there is at least one unread message
                }
            }
        ]);

        return NextResponse.json({
            count: unreadTickets.reduce((acc, ticket) => acc + ticket.unreadMessageIds.length, 0),
            unreadTickets
        })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}