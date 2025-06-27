import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { authOption } from "../../../auth/[...nextauth]/route";
import { User } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";

const stripeSecretKey: string = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecretKey);

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const user = await User.findOne({ _id: session.user._id })
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
        if (!user.stripeCustomerId) return NextResponse.json({ message: 'Stripe profile not found' }, { status: 404 })

        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
        }).then(res => res.data);

        return NextResponse.json(paymentMethods)
    } catch (err) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const user = await User.findOne({ _id: session.user._id })
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
        if (!user.stripeCustomerId) return NextResponse.json({ message: 'Stripe profile not found' }, { status: 404 })

        const setupIntent = await stripe.setupIntents.create({
            customer: user.stripeCustomerId,
        });

        return NextResponse.json({ clientSecret: setupIntent.client_secret })
    } catch (err) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}


export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const user = await User.findOne({ _id: session.user._id })
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
        if (!user.stripeCustomerId) return NextResponse.json({ message: 'Stripe profile not found' }, { status: 404 })

        const { paymentMethodId } = await req.json()
        if (!paymentMethodId) return NextResponse.json({ message: 'Invalid Request' }, { status: 400 })

        await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
