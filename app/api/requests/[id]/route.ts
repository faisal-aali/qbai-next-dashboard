import { NextRequest, NextResponse } from "next/server";
import { validateError } from "@app/lib/functions";
import { Request } from "@app/lib/models";
import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";
import * as Yup from 'yup';
import mongoose from "mongoose";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { pathname } = new URL(req.url);
        const id = pathname.split('/').pop(); // /api/requests/:id
        if (!id) return NextResponse.json({ message: 'Request ID is required' }, { status: 400 })
        if (!mongoose.isValidObjectId(id)) return NextResponse.json({ message: 'Request ID must be a valid Object ID' }, { status: 400 })

        const data = await req.json()

        const schema = Yup.object({
            isViewed: Yup.boolean().optional(),
            action: Yup.string().oneOf(['pending', 'rejected', 'accepted']).optional(),
        });

        await schema.validate(data)

        const request = await Request.findOne({ _id: id })
        if (!request) return NextResponse.json({ message: 'Invalid Request Id' }, { status: 404 });

        if (data.isViewed !== undefined) request.isViewed = data.isViewed
        if (data.action) request.action = data.action

        await request.save()

        return NextResponse.json({ message: 'Request has been updated' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}