import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "@/app/lib/mongodb";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const trainerId = searchParams.get('trainerId')
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    try {
        // Auth check
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

        // Build query
        const query: { isDeleted: boolean, 'roleData.trainerId'?: mongoose.Types.ObjectId, name?: { $regex: string, $options: string } } = {
            isDeleted: false
        };

        if (trainerId) query['roleData.trainerId'] = new mongoose.Types.ObjectId(trainerId);
        if (search) query.name = { $regex: search, $options: 'i' };

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Get users with their best video metrics
        const users = await User.aggregate([
            { $match: query },
            // Lookup videos for each user
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
                    as: 'bestVideo'
                }
            },
            // Unwind the bestVideo array (will be null if no videos)
            {
                $unwind: {
                    path: '$bestVideo',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Add metrics from best video
            {
                $addFields: {
                    metrics: {
                        $cond: {
                            if: { $ifNull: ['$bestVideo', false] },
                            then: '$bestVideo.assessmentDetails',
                            else: {}
                        }
                    }
                }
            },
            // Project only needed fields
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
            },
            // Pagination
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]);

        return NextResponse.json({
            players: users,
            total,
            page,
            limit
        })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}