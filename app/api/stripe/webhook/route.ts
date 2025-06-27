import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Subscription, User } from "@/app/lib/models";
import { handlePaymentSuccess, handleSubscriptionCancel, handleSubscriptionSuccess } from "@/app/lib/stripe";
import { validateError } from "@/app/lib/functions";
import { headers } from "next/headers";
import { PostSubscriptionUpdate } from "@/app/lib/zapier";

const stripeSecretKey: string = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecretKey);

const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
    try {
        const data = await req.text()
        // console.log('[/stripe/webhook] data', data)

        const signature = headers().get("stripe-signature") as string;

        const event = stripe.webhooks.constructEvent(data, signature, secret);

        // Handle the event
        switch (event.type) {
            case 'invoice.payment_succeeded':
                console.log('subscription succeed')
                // Update subscription status in the database
                let subscription = event.data.object.subscription;
                console.log(subscription)
                if (typeof subscription === 'string') {
                    subscription = await stripe.subscriptions.retrieve(subscription);
                }
                if (!subscription || typeof subscription === 'string') return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
                await handleSubscriptionSuccess({ subscription })

                // POST to Zapier
                User.findOne({ stripeCustomerId: subscription.customer }).then(user => {
                    if (user) PostSubscriptionUpdate(user._id.toString()).catch(err => console.error('[Zapier] FATAL ERROR:', err))
                })

                break;
            case 'customer.subscription.updated':
                console.log('subscription updated')
                // Update subscription status in the database
                const updatedSubscription = event.data.object;

                await Subscription.updateOne({
                    stripeSubscriptionId: updatedSubscription.id
                }, {
                    status: updatedSubscription.status,
                    lastUpdated: new Date()
                })

                // POST to Zapier
                Subscription.findOne({ stripeSubscriptionId: updatedSubscription.id }).then(subscription => {
                    if (subscription) PostSubscriptionUpdate(subscription.userId).catch(err => console.error('[Zapier] FATAL ERROR:', err))
                }).catch(console.error)

                break;
            case 'customer.subscription.deleted':
                console.log('subscription deleted')
                // Update subscription status in the database
                const deletedSubscription = event.data.object;

                const dbSubscription = await Subscription.findOne({ stripeSubscriptionId: deletedSubscription.id })
                if (!dbSubscription) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })

                await handleSubscriptionCancel({ subscriptionId: deletedSubscription.id })

                // POST to Zapier
                PostSubscriptionUpdate(dbSubscription.userId).catch(err => console.error('[Zapier] FATAL ERROR:', err))

                break;
            case 'payment_intent.succeeded':
                console.log('payment succeed')
                const paymentIntent = event.data.object;
                if (paymentIntent.metadata.userId)
                    handlePaymentSuccess({ paymentIntent });
                break;
        }

        return NextResponse.json('OK', { status: 200 })
    } catch (err) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
