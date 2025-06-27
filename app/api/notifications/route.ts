import { NextRequest, NextResponse } from "next/server";
import { Category, Notification } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import axios from 'axios';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id')

    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const query: { _id?: string, userId: string } = { userId: session.user._id };

        if (id) query._id = id;

        const notification = await Notification.find(query)

        return NextResponse.json(notification)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}