import { NextRequest, NextResponse } from "next/server";
import { Request, Video } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const data = await req.json()
        if (!data.reason) return NextResponse.json({ message: 'Reason is required' }, { status: 400 })
        if (!data.videoId) return NextResponse.json({ message: 'Video ID is required' }, { status: 400 })
        if (!mongoose.isValidObjectId(data.videoId)) return NextResponse.json({ message: 'Video ID must be a valid Object ID' }, { status: 400 })

        const video = await Video.findOne({ _id: data.videoId, isDeleted: false })
        if (!video) return NextResponse.json({ message: 'Invalid Video ID provided' }, { status: 400 })
        if (video.uploadedBy.toString() !== session.user._id.toString()) return NextResponse.json({ message: 'The video was not uploaded by you' }, { status: 403 })
        if (await Request.findOne({ entityId: video._id })) return NextResponse.json({ message: 'A request for that video already exists' }, { status: 405 })

        const request = await Request.create({
            userId: session.user._id,
            entityId: data.videoId,
            requestType: 'video_deletion',
            reason: data.reason
        })

        return NextResponse.json({ message: `Request has been created with id ${request._id}` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}