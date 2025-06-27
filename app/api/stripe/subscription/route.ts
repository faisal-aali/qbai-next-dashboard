import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { authOption } from "../../auth/[...nextauth]/route";
import { User, Package, Subscription } from "@/app/lib/models";
import { createCustomer, handleSubscriptionSuccess, updateCustomer } from "@/app/lib/stripe";
import { validateError } from "@/app/lib/functions";

const stripeSecretKey: string = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecretKey);

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || !['player', 'trainer'].includes(session.user.role)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const subscription = await Subscription.findOne({ userId: session.user._id })

        return NextResponse.json(subscription || {})
    } catch (err) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || !['player', 'trainer'].includes(session.user.role)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const user = await User.findOne({ _id: session.user._id })
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        const { paymentMethodId, packageId } = await req.json();

        if (!paymentMethodId || !packageId) return NextResponse.json({ message: "Invalid request" }, { status: 400 });

        console.log('packageId is', packageId)
        const _package = await Package.findOne({ _id: packageId })
        if (!_package) return NextResponse.json({ message: "Package not found" }, { status: 404 });

        let customer;
        if (!user.stripeCustomerId) customer = await createCustomer({ user, paymentMethodId })
        else customer = await updateCustomer({ user, paymentMethodId })

        const db_subscription = await Subscription.findOne({ userId: session.user._id, status: 'active', type: 'paid' }, {}, { sort: { creationDate: -1 } })

        let subscription: Stripe.Response<Stripe.Subscription>;
        if (db_subscription && db_subscription.stripeSubscriptionId) {
            const old_subscription = await stripe.subscriptions.retrieve(db_subscription.stripeSubscriptionId);
            console.log('old_subscription status', old_subscription.status)
            subscription = await stripe.subscriptions.update(old_subscription.id, {
                cancel_at_period_end: false,
                proration_behavior: 'always_invoice',
                items: [{
                    id: old_subscription.items.data[0].id,
                    price: _package.stripePlanId,
                }],
                expand: ['latest_invoice.payment_intent'],
            });
        } else {
            subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{ plan: _package.stripePlanId }],
                expand: ['latest_invoice.payment_intent'],
            });
        }

        console.log('latest_invoice', subscription.latest_invoice)

        if (!subscription.latest_invoice || typeof subscription.latest_invoice === "string") {
            return NextResponse.json({ message: "Unable to retrieve latest invoice." }, { status: 500 });
        }

        const paymentIntent = subscription.latest_invoice.payment_intent;

        if (paymentIntent && typeof paymentIntent !== "string" && paymentIntent.status === 'requires_action') {
            return NextResponse.json({
                requiresAction: true,
                paymentIntentClientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            });
        } else {
            // Handle successful subscription setup
            // await handleSubscriptionSuccess({ subscription });
            return NextResponse.json({ success: true });
        }

    } catch (err) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
