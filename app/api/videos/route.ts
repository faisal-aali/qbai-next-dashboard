import { NextRequest, NextResponse } from "next/server";
import { calculateCredits, extractVideoFramerate, validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { User, Video } from "@/app/lib/models";
import mongoose from "@/app/lib/mongodb";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";
import { convertCmToInches } from "@/util/utils";
import { updateAssessment, updateAssessments } from "@/app/lib/assessments";
import motionAPI from "@/app/lib/3motion";

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
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');
        const trainerId = searchParams.get('trainerId');

        const query: { _id?: string, userId?: string | object, isDeleted: boolean } = { isDeleted: false };

        if (id) query._id = id;
        if (userId) query.userId = userId;
        if (trainerId) {
            const players = await User.find({ 'roleData.trainerId': new mongoose.Types.ObjectId(trainerId) })
            query.userId = { $in: players.map(p => p._id) };
        }

        console.log(query)

        const videos = await Video.find(query, {}, { sort: { creationDate: -1 } });

        // for (const video of videos) {
        //     if (!video.assessmentDetails.fileUrl) continue;
        //     const url = new URL(video.assessmentDetails.fileUrl)
        //     const signatureExpiry = url.searchParams.get('se')
        //     console.log('signatureExpiry', signatureExpiry)
        //     if (new Date(signatureExpiry as string).getTime() < new Date().getTime()) {
        //         const assessmentDetails = await _3Motion.getAssessmentDetails({ taskId: video.taskId, taskType: video.taskType })
        //         video.assessmentDetails = assessmentDetails
        //         video.save().then(() => console.log('updated assessmentDetails for', video.taskId))
        //     }
        // }

        return NextResponse.json(videos);
    } catch (err: unknown) {
        console.error(err);
        const obj = validateError(err);
        return NextResponse.json({ message: obj.message }, { status: obj.status });
    }
}

export async function POST(req: NextRequest) {
    try {

        const contentType = req.headers.get('content-type');

        const data: {
            playerId: string | null,
            isBase64: number,
            file: File | null,
            thumbnailUrl: string | null
        } = {
            playerId: null,
            isBase64: 0,
            file: null,
            thumbnailUrl: null
        }

        if (contentType === 'application/json') {
            // Handle JSON request
            const body = await req.json();
            data.playerId = body.playerId
            data.isBase64 = body.isBase64
            data.file = body.file
            data.thumbnailUrl = body.thumbnailUrl
        } else if (contentType?.startsWith('multipart/form-data')) {
            // Handle form-data request
            const formData = await req.formData();
            data.playerId = formData.get('playerId')?.toString() || null
            data.isBase64 = Number(formData.get('isBase64')) || 0
            data.file = formData.get('file') as File
            data.thumbnailUrl = formData.get('thumbnailUrl')?.toString() || null
        } else {
            return new Response(JSON.stringify({ error: 'Unsupported Content-Type' }), { status: 415 });
        }

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

        let userId = session.user._id
        if (['trainer', 'staff'].includes(session.user.role)) {
            userId = data.playerId as string
            if (!userId) return NextResponse.json({ message: 'playerId is required' }, { status: 400 });
        }

        const file = data.file as File
        const isBase64 = data.isBase64

        const frameRate = await extractVideoFramerate(file, isBase64)
        console.log('frameRate is', frameRate)

        if (!frameRate || frameRate < 100) return NextResponse.json({ message: 'Invalid video format or framerate', invalidVideo: true }, { status: 400 });

        const user = await User.findOne({ _id: userId })
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const credits = await calculateCredits(['trainer', 'staff'].includes(session.user.role) ? session.user._id.toString() : user._id.toString())
        if (credits.remaining < 1) return NextResponse.json({ message: 'Out of credits' }, { status: 403 });

        if (!user.roleData.weight || !user.roleData.height) return NextResponse.json({ message: 'Weight and height is required' }, { status: 400 });

        const heightInInches = convertCmToInches(user.roleData.height)

        if (!heightInInches) return NextResponse.json({ message: 'Error occured converting height to inches' }, { status: 500 });

        const height = Math.round(heightInInches)
        const weight = Math.round(user.roleData.weight)

        const assessment = await motionAPI.createAssessment({
            height,
            weight,
            file,
            frameRate,
            isBase64
        })

        //TODO: fix delivery date to reflect actual date

        const newVideo = await Video.create({
            userId: userId,
            uploadedBy: session.user._id,
            thumbnailUrl: data.thumbnailUrl,
            taskId: assessment.assessmentId,
            assessmentMappingId: assessment.id,
            deliveryDate: new Date().getTime() + 600000,
            framerate: frameRate,
            motionApiVersion: 'core'
        });
        await updateAssessment(newVideo._id)

        return NextResponse.json({ message: `Video has been queued with id ${newVideo._id}` }, { status: 200 });
    } catch (err: unknown) {
        console.error(err);
        const obj = validateError(err);
        return NextResponse.json({ message: obj.message }, { status: obj.status });
    }
}

// update pending assessments every 1 hour
setInterval(() => {
    updateAssessments()
}, 3600000);

// updateAssessments()