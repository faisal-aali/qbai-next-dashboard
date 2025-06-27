import { NextRequest, NextResponse } from "next/server";
import { Video, User } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "@/app/lib/mongodb";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken';
import { IUser } from "@/app/lib/interfaces/user";

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
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const trainerId = searchParams.get('trainerId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const query: { userId?: string | object, isDeleted: boolean } = { isDeleted: false };

        if (userId) query.userId = userId;
        if (trainerId) {
            const players = await User.find({ 'roleData.trainerId': new mongoose.Types.ObjectId(trainerId) })
            query.userId = { $in: players.map(p => p._id) };
        }

        const [videos, total] = await Promise.all([
            Video.find(query, {}, { sort: { creationDate: -1 } }).skip(skip).limit(limit),
            Video.countDocuments(query)
        ]);

        return NextResponse.json({
            videos,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err: unknown) {
        console.error(err);
        const obj = validateError(err);
        return NextResponse.json({ message: obj.message }, { status: obj.status });
    }
} 