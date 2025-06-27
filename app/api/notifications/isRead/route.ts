import { NextRequest, NextResponse } from "next/server";
import { Category, Notification } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        await Notification.updateMany({ userId: session.user._id }, { isRead: true })

        return NextResponse.json({ message: 'Success' })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}