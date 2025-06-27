import { NextRequest, NextResponse } from "next/server";
import { User, Subscription, Package, Video } from "@/app/lib/models";
import { calculateCredits, validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "@/app/lib/mongodb";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";
import _3Motion from "@/app/lib/3motion";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role')
    const trainerId = searchParams.get('trainerId')
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    try {
        var session;
        const authHeader = headers().get("authorization")
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as Partial<IUser>;
            if (!user._id) throw Error('Malformed JWT');
            user.credits = await calculateCredits(user._id.toString());
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const query: { 
            isDeleted: boolean, 
            role?: string, 
            'roleData.trainerId'?: mongoose.Types.ObjectId,
            $or?: Array<{ [key: string]: { $regex: string, $options: string } }>
        } = {
            isDeleted: false
        };

        if (role) query.role = role;
        if (trainerId) query['roleData.trainerId'] = new mongoose.Types.ObjectId(trainerId);
        
        // Add search filter if provided
        if (search) {
            const filteredSearchQuery = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: filteredSearchQuery, $options: 'i' } },
                { email: { $regex: filteredSearchQuery, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Get paginated users
        const users = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'subscriptions',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', '$$userId'] },
                                        { $gt: ['$currentPeriodEnd', new Date()] }
                                    ]
                                }
                            }
                        },
                        { $sort: { creationDate: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'subscription'
                }
            },
            {
                $unwind: {
                    path: '$subscription',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'packages',
                    let: {
                        packageId: '$subscription.packageId',
                        currentPeriodEnd: '$subscription.currentPeriodEnd'
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$_id', '$$packageId'] },
                                        { $gt: ['$$currentPeriodEnd', new Date()] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'subscription.package'
                }
            },
            {
                $unwind: {
                    path: '$subscription.package',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'packages',
                    let: { userRole: '$role' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$plan', 'free'] },
                                        { $eq: ['$role', '$$userRole'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'freePackage'
                }
            },
            {
                $addFields: {
                    'subscription.package': {
                        $ifNull: ['$subscription.package', { $arrayElemAt: ['$freePackage', 0] }]
                    },
                    'subscription.freePackage': { $arrayElemAt: ['$freePackage', 0] },
                }
            },
            {
                $project: {
                    freePackage: 0
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]);

        await Promise.all(users.map((user) => (
            calculateCredits(user._id).then(credits => {
                user.credits = credits
            })
        )))

        

        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
} 