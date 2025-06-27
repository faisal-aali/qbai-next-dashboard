import { NextRequest, NextResponse } from "next/server";
import { User, Subscription, Package, Video, Purchase } from "@/app/lib/models";
import * as Yup from 'yup'
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendEmail } from "@/app/lib/sendEmail";
import { calculateCredits, validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "@/app/lib/mongodb";
import { IVideo } from "@/app/lib/interfaces/video";
import axios from 'axios'

import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";
import motionAPI from "@/app/lib/3motion";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id')
    const role = searchParams.get('role')
    const trainerId = searchParams.get('trainerId')
    const includeMetrics = Number(searchParams.get('includeMetrics'));

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

        const query: { isDeleted: boolean, role?: string, _id?: mongoose.Types.ObjectId, 'roleData.trainerId'?: mongoose.Types.ObjectId } = {
            isDeleted: false
        };

        if (id) query._id = new mongoose.Types.ObjectId(id);
        if (role) query.role = role;
        if (trainerId) query['roleData.trainerId'] = new mongoose.Types.ObjectId(trainerId);

        // const users = await User.find(query).populate('subscription')

        const users = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'subscriptions', // The name of the subscription collection
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', '$$userId'] }, // Match userId
                                        { $gt: ['$currentPeriodEnd', new Date()] } // Ensure currentPeriodEnd > now
                                    ]
                                }
                            }
                        },
                        { $sort: { creationDate: -1 } },
                        { $limit: 1 } // Take the latest subscription
                    ],
                    as: 'subscription'
                }
            },
            {
                $unwind: {
                    path: '$subscription',
                    preserveNullAndEmptyArrays: true // If you want to include users with no subscription
                }
            },
            {
                $lookup: {
                    from: 'packages', // Join with the packages collection
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
                                        { $gt: ['$$currentPeriodEnd', new Date()] } // Ensure the current period end is after the current date
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
                    preserveNullAndEmptyArrays: true // Include subscriptions with no package
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
                                        { $eq: ['$plan', 'free'] }, // Assuming 'Free' is the default package name
                                        { $eq: ['$role', '$$userRole'] } // Match the role with the user's role
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
                        $ifNull: ['$subscription.package', { $arrayElemAt: ['$freePackage', 0] }] // Use subscription package or default package
                    },
                    'subscription.freePackage': { $arrayElemAt: ['$freePackage', 0] },
                }
            },
            {
                $project: {
                    freePackage: 0
                }
            }
        ]);

        await Promise.all(users.map((user) => (
            calculateCredits(user._id).then(credits => {
                user.credits = credits
            })
        )))

        //TODO: fix the url logic

        if (includeMetrics) {
            await Promise.all(users.map((user) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const videos = await Video.find({ userId: user._id, 'assessmentDetails.statusCode': "Completed", isDeleted: false })

                        if (videos.length === 0) {
                            user.metrics = {}
                        } else {
                            let video = videos.filter(v => v.assessmentDetails?.fileUrl).reduce((max, video) => video.assessmentDetails?.stats?.metrics?.overall_score > max.assessmentDetails?.stats?.metrics?.overall_score ? video : max)
                            // const url = new URL(video.assessmentDetails.fileUrl)
                            // const signatureExpiry = url.searchParams.get('se')
                            // console.log('signatureExpiry', signatureExpiry)
                            // if (new Date(signatureExpiry as string).getTime() < new Date().getTime()) {
                            //     const assessmentDetails = await motionAPI.getAssessmentDetails({ taskId: video.taskId, taskType: video.taskType })
                            //     video.assessmentDetails = assessmentDetails
                            //     video.save().then(() => console.log('updated assessmentDetails for', video.taskId))
                            // }
                            user.metrics = video.assessmentDetails
                        }

                        resolve(true)
                    } catch (err) {
                        reject(err)
                    }
                })
            }))
        }

        return NextResponse.json(users)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}