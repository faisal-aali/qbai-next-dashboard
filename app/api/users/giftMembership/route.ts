import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Package, Purchase, Subscription, User } from "@/app/lib/models";
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
            userId: Yup.string().required("User Id is required")
        });

        await schema.validate(data)

        if (await Subscription.findOne({ userId: data.userId, currentPeriodEnd: { $gt: new Date() }, type: 'gift', status: 'active' })) return NextResponse.json({ message: 'Gifted membership already exists' }, { status: 400 })

        const user = await User.findOne({ _id: data.userId })
        if (!user) return NextResponse.json({ message: 'User does not exist' }, { status: 404 })

        const _package = await Package.findOne({ name: 'Basic Membership', plan: 'quarterly', role: user.role })
        if (!_package) return NextResponse.json({ message: 'Could not find the package' }, { status: 500 })


        await Subscription.create({
            userId: data.userId,
            amount: 0,
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date('2099-12-31').toISOString(),
            packageId: _package._id,
            status: 'active',
            stripeSubscriptionId: null,
            giftedBy: session.user._id,
            type: 'gift'
        })

        return NextResponse.json({ message: `User has been gifted Basic Membership` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}