import { NextRequest, NextResponse } from "next/server";
import { Notification, Purchase, Request, User, Subscription, Video } from "@/app/lib/models";
import crypto from "crypto";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";

export async function DELETE(req: NextRequest) {
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
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const user = await User.findOne({ _id: session.user._id, isDeleted: false })
        if (!user) return NextResponse.json({ message: 'User does not exist' }, { status: 400 })

        await Notification.deleteMany({ userId: user._id })
        await Purchase.deleteMany({ userId: user._id })
        await Request.deleteMany({ userId: user._id })
        await Subscription.deleteMany({ userId: user._id })
        await Video.deleteMany({ userId: user._id })
        await User.deleteOne({ _id: user._id })

        const linkedUser = await User.findOne({ 'roleData.linkedUserId': user._id })
        console.log('linkedUser', linkedUser)
        if (linkedUser) {
            linkedUser.roleData = {
                ...linkedUser.roleData,
                linkedUserId: null
            }
            await linkedUser.save()
        }

        return NextResponse.json({ message: 'User has been deleted' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}