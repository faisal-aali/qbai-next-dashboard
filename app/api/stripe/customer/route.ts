import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { User } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";

const stripeSecretKey: string = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecretKey);

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOption);
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {

        const user = await User.findOne({ _id: session.user._id })
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
        if (!user.stripeCustomerId) return NextResponse.json({ message: 'Stripe profile not found' }, { status: 404 })

        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (customer.deleted) return NextResponse.json({ message: 'Customer profile has been deleted' }, { status: 404 })

        return NextResponse.json(customer)
    } catch (err) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
