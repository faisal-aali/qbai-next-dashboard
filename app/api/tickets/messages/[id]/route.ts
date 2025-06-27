import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Promocode, Purchase, User, Request, Ticket, TicketMessage } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "@/app/api/auth/[...nextauth]/route";
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

        const { pathname } = new URL(req.url);
        const segments = pathname.split('/');
        const id = segments[segments.length - 1];

        if (!id || id === 'messages') return NextResponse.json({ message: 'Ticket Object ID is required' }, { status: 400 });
        if (!mongoose.isValidObjectId(id)) return NextResponse.json({ message: 'Ticket Object ID must be a valid Object ID' }, { status: 400 });

        if (session.user.role !== 'admin') {
            const ticket = await Ticket.findOne({ _id: id })
            if (!ticket) return NextResponse.json({ message: 'Ticket not found' }, { status: 404 })
            if (ticket.userId.toString() !== session.user._id.toString()) return NextResponse.json({ message: 'Ticket was not created by you' }, { status: 403 })
        }

        // const messages = await TicketMessage.find({ ticketObjectId: id }, {}, { sort: { creationDate: 1 } }).populate('userId')
        const messages = await TicketMessage.aggregate([
            { $match: { ticketObjectId: new mongoose.Types.ObjectId(id) } },
            { $sort: { creationDate: 1 } },
            {
                $lookup: {
                    from: 'users', localField: 'userId', foreignField: '_id', as: 'user', pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                email: 1,
                                role: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: '$user' }
        ])

        return NextResponse.json(messages)
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
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { pathname } = new URL(req.url);
        const segments = pathname.split('/');
        const id = segments[segments.length - 1];

        if (!id || id === 'messages') return NextResponse.json({ message: 'Ticket Object ID is required' }, { status: 400 });
        if (!mongoose.isValidObjectId(id)) return NextResponse.json({ message: 'Ticket Object ID must be a valid Object ID' }, { status: 400 });

        const data = await req.json()

        const schema = Yup.object({
            message: Yup.string().required("Message is required"),
            attachments: Yup.array().required("Attachment(s) is required")
        });

        await schema.validate(data)

        const ticket = await Ticket.findOne({ _id: id })
        if (!ticket) return NextResponse.json({ message: 'Ticket not found' }, { status: 404 })

        if (ticket.status === 'closed') return NextResponse.json({ message: 'Ticket is closed' }, { status: 403 })

        if (session.user.role !== 'admin') {
            if (ticket.userId.toString() !== session.user._id?.toString()) return NextResponse.json({ message: 'Ticket was not created by you' }, { status: 403 })
        }

        await TicketMessage.create({
            ticketObjectId: ticket._id,
            userId: session.user._id,
            message: data.message,
            attachments: data.attachments,
            viewedBy: [session.user._id?.toString()]
        })

        return NextResponse.json({ message: `Message has been created` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}