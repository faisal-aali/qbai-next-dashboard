import { NextRequest, NextResponse } from "next/server";
import { Promocode, Ticket } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";
import mongoose, { ObjectId } from "mongoose";

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
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        if (session.user.role !== 'admin') return NextResponse.json({ message: 'Cannot access this resource' }, { status: 401 })

        const data = await req.json()

        const schema = Yup.object({
            _id: Yup.string().required("Ticket _id is required")
        });

        await schema.validate(data)

        const ticket = await Ticket.findOne({ _id: data._id })
        if (!ticket) return NextResponse.json({ message: 'Invalid ticket _id' }, { status: 404 });
        if (ticket.status === 'closed') return NextResponse.json({ message: 'Ticket is not open' }, { status: 400 });

        ticket.closedBy = session.user._id as ObjectId;
        ticket.closingDate = new Date()
        ticket.status = 'closed';

        await ticket.save()

        return NextResponse.json({ message: 'Ticket has been closed' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}