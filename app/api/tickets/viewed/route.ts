import { NextRequest, NextResponse } from "next/server";
import { Promocode, Ticket, TicketMessage } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";

export async function PATCH(req: NextRequest) {
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
        if (!session || !session.user || !session.user._id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        // if (session.user.role !== 'admin') return NextResponse.json({ message: 'Cannot access this resource' }, { status: 401 })
        const sessionUserId = session.user._id.toString()

        const data = await req.json()

        const schema = Yup.object({
            _id: Yup.string().required("Ticket _id is required"),
        });

        await schema.validate(data)

        const ticket = await Ticket.findOne({ _id: data._id })
        if (!ticket) return NextResponse.json({ message: 'Invalid ticket _id' }, { status: 404 });
        if (session.user.role !== 'admin') {
            if (ticket.userId.toString() !== sessionUserId) return NextResponse.json({ message: 'Ticket was not created by you' }, { status: 401 })
        }

        const unreadMessages = await TicketMessage.find({ ticketObjectId: ticket._id, viewedBy: { $nin: [sessionUserId] } })
        if (unreadMessages.length === 0) return NextResponse.json({ message: 'No unread messages' }, { status: 200 })

        console.log('unreadMessages', unreadMessages)

        await Promise.all(unreadMessages.map(async (message) => {
            message.viewedBy = message.viewedBy.concat(sessionUserId);
            await message.save()
        }))

        return NextResponse.json({ message: 'Ticket messages have been marked as read' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}