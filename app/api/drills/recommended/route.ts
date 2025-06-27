import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, RecommendationCriteria, Subscription, User } from "@/app/lib/models";
import { validateError, getRecommendedDrills } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";
import mongoose from "mongoose";
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
        if (!session || !session.user || !session.user._id || !session.user.role) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        if (!['player', 'trainer'].includes(session.user.role)) return NextResponse.json({ message: 'This resource is only accessible to players and trainers' }, { status: 403 })

        const playerId = session.user.role === 'trainer' ? req.nextUrl.searchParams.get('playerId') : session.user._id.toString()
        if (!playerId) return NextResponse.json({ message: 'Player ID is required' }, { status: 400 })

        if (session.user.role === 'trainer') {
            console.log('playerId', playerId, 'trainerId', session.user._id)
            const player = await User.findOne({ _id: playerId, 'roleData.trainerId': new mongoose.Types.ObjectId(session.user._id.toString()) })
            if (!player) return NextResponse.json({ message: 'Player not found or is not assigned to you' }, { status: 404 })
        }

        const drills = await getRecommendedDrills(playerId)

        const subscription = await Subscription.findOne({ userId: session.user._id, currentPeriodEnd: { $gt: new Date() } }, {}, { sort: { creationDate: -1 } })

        for (const drill of drills) {
            if (!drill.isFree)
                if (['player', 'trainer'].includes(session.user.role))
                    if (!subscription)
                        drill.videoLink = ''
        }

        return NextResponse.json(drills)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}