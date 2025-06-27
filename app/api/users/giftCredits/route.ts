import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Purchase, User } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const data = await req.json()

        const schema = Yup.object({
            // userId: Yup.string().required("User Id is required"),
            userId: Yup.string().required("User Id is required"),
            credits: Yup.number().min(1, 'Credits must be greater than 0').required("Credits is required"),
        });

        await schema.validate(data)

        await Purchase.create({
            userId: data.userId,
            giftedBy: session.user._id,
            amount: 0,
            credits: data.credits,
            stripeIntentId: null,
            type: 'gift',
        })

        return NextResponse.json({ message: `User has been gifted` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}