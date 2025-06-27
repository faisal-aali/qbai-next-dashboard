import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Package, Purchase, Subscription, User } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId')

        if (!userId) return NextResponse.json({ message: 'User ID is required' }, { status: 400 })

        const subscription = await Subscription.findOne({ userId, type: 'gift', status: 'active' })

        return NextResponse.json({ subscription }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}