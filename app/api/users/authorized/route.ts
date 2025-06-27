import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOption } from "../../auth/[...nextauth]/route";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { getServerSession } from "next-auth";
import { validateError, calculateCredits } from "@/app/lib/functions";
import { IUser } from "@/app/lib/interfaces/user";
import { User } from "@/app/lib/models";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        var session;
        const authHeader = headers().get("authorization")
        if (authHeader) {
            const sessionUser = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as Partial<IUser>;
            if (!sessionUser._id) throw Error('Malformed JWT');
            session = { user: sessionUser };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const user = (await User.findOne({ _id: session.user._id }, { _id: 1, name: 1, email: 1, role: 1, emailVerified: 1, avatarUrl: 1, credits: 1 }))?.toObject()
        if (!user) return NextResponse.json({ message: 'User does not exist' }, { status: 400 })

        user.credits = await calculateCredits(user._id.toString());

        console.log('user is', user)

        return NextResponse.json(user)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}