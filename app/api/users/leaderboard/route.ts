import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/models";
import { calculateCredits, validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "@/app/lib/mongodb";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken';
import { IUser } from "@/app/lib/interfaces/user";
import { PipelineStage } from "mongoose";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    try {
        // Auth check
        let session;
        const authHeader = headers().get("authorization");
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as Partial<IUser>;
            if (!user._id) throw Error('Malformed JWT');
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const isPlayerOrStaffOrTrainer = ['player', 'staff', 'trainer'].includes(session.user.role as string);
        const isAdmin = session.user.role === 'admin';
        
        // Check if non-admin player/staff/trainer is trying to access page beyond 2
        if (!isAdmin && isPlayerOrStaffOrTrainer && page > 2) {
            return NextResponse.json({ message: 'Forbidden: Access to this page is not allowed' }, { status: 403 });
        }

        const basePipeline: PipelineStage[] = [
            { $match: { isDeleted: false } },
            {
                $lookup: {
                    from: 'videos',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', '$$userId'] },
                                        { $eq: ['$isDeleted', false] },
                                        { $eq: ['$assessmentDetails.statusCode', 'Completed'] }
                                    ]
                                }
                            }
                        },
                        {
                            $match: {
                                'assessmentDetails.fileUrl': { $exists: true }
                            }
                        },
                        {
                            $sort: {
                                'assessmentDetails.stats.metrics.overall_score': -1
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: 'metrics'
                }
            },
            {
                $addFields: {
                    metrics: { $arrayElemAt: ['$metrics.assessmentDetails', 0] }
                }
            },
            {
                $match: {
                    'metrics': { $exists: true, $ne: null }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    avatarUrl: 1,
                    creationDate: 1,
                    metrics: 1,
                    role: 1,
                    roleData: 1
                }
            }
        ];

        // Run once for count (without pagination)
        const countResult = await User.aggregate([
            ...basePipeline,
            { $count: 'total' }
        ]);
        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / (isPlayerOrStaffOrTrainer ? 20 : limit));

        // Run again for paginated result
        const users = await User.aggregate([
            ...basePipeline,
            { $sort: { 'metrics.stats.metrics.overall_score': -1 } },
            { $skip: (page - 1) * (isPlayerOrStaffOrTrainer ? 10 : limit) },
            { $limit: isPlayerOrStaffOrTrainer ? 10 : limit }
        ]);

        // Enhance each user with credits
        await Promise.all(users.map(async (user) => {
            user.credits = await calculateCredits(user._id);
        }));

        return NextResponse.json({
            players: users,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit: isPlayerOrStaffOrTrainer ? 10 : limit
            }
        });

    } catch (err: unknown) {
        console.error(err);
        const obj = validateError(err);
        return NextResponse.json({ message: obj.message }, { status: obj.status });
    }
}
