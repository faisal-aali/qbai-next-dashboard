import { NextRequest, NextResponse } from "next/server";
import { Video } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { pathname } = new URL(req.url);
        const id = pathname.split('/').pop(); // /api/videos/:id
        if (!id) return NextResponse.json({ message: 'Video ID is required' }, { status: 400 });
        if (!mongoose.isValidObjectId(id)) return NextResponse.json({ message: 'Video ID must be a valid Object ID' }, { status: 400 });

        const video = await Video.findOne({ _id: id });
        if (!video) return NextResponse.json({ message: 'Video does not exist' }, { status: 400 });

        video.isDeleted = true;

        await video.save();

        return NextResponse.json({ message: 'Video has been deleted' }, { status: 200 });
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err);
        return NextResponse.json({ message: obj.message }, { status: obj.status });
    }
}