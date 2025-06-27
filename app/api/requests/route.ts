import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Promocode, Purchase, User, Request } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url);
        const isViewed = searchParams.get('isViewed')
        console.log('isViewed is', isViewed)
        const query: { isViewed?: boolean, userId?: mongoose.Types.ObjectId } = {};
        if (session.user.role !== 'admin') query.userId = new mongoose.Types.ObjectId(session.user._id);
        if (isViewed) query.isViewed = (isViewed === 'true' ? true : isViewed === 'false' ? false : undefined);

        console.log('query is', query)

        const requests = await Request.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    'user.password': 0,
                    'user.stripeCustomerId': 0
                }
            },
            {
                $sort: { creationDate: -1 }
            }
        ])

        return NextResponse.json(requests)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}