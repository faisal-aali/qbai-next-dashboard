import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Package, Purchase, Subscription, User } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const data = await req.json()

        const schema = Yup.object({
            userId: Yup.string().required("User Id is required")
        });

        await schema.validate(data)

        const subscription = await Subscription.findOne({ type: 'gift', userId: data.userId, currentPeriodEnd: { $gt: new Date() } })

        if (!subscription) return NextResponse.json({ message: 'Could not find gifted subscription' }, { status: 400 })

        subscription.status = 'canceled';
        subscription.currentPeriodEnd = new Date();
        subscription.lastUpdated = new Date();

        await subscription.save();

        return NextResponse.json({ message: `User subscription has been canceled` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}