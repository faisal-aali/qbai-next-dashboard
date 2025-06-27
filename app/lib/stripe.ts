import Stripe from "stripe";
import { IUser } from "./interfaces/user";
import { Package, Purchase, Subscription, User } from "./models";

const stripeSecretKey: string = process.env.STRIPE_SECRET_KEY || "";

const stripe = new Stripe(stripeSecretKey, {});

async function createCustomer({ user, paymentMethodId }: { user: IUser, paymentMethodId: string }): Promise<Stripe.Response<Stripe.Customer>> {
    return new Promise(async (resolve, reject) => {
        try {
            const customer = await stripe.customers.create({
                payment_method: paymentMethodId,
                email: user.email,
                name: user.name,
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
            await User.updateOne({ _id: user._id }, { stripeCustomerId: customer.id })
            resolve(customer)
        } catch (err) {
            reject(err)
        }
    })
}

async function updateCustomer({ user, paymentMethodId }: { user: IUser, paymentMethodId: string }): Promise<Stripe.Response<Stripe.Customer>> {
    return new Promise(async (resolve, reject) => {
        try {
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: user.stripeCustomerId as string,
            });

            const customer = await stripe.customers.update(user.stripeCustomerId as string, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
            resolve(customer)
        } catch (err) {
            reject(err)
        }
    })
}

async function handleSubscriptionSuccess({ subscription }: { subscription: Stripe.Subscription }): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('handleSubscriptionSuccess', subscription)
            const user = await User.findOne({ stripeCustomerId: subscription.customer as string })
            if (!user) return reject({ message: 'Customer not found' })

            const plan = subscription.items.data[0].plan

            const _package = await Package.findOne({ stripePlanId: plan.id })
            if (!_package) return reject({ message: 'Package not found' })

            await Subscription.create({
                userId: user._id,
                amount: plan.amount,
                currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                packageId: _package._id,
                status: subscription.status,
                stripeSubscriptionId: subscription.id,
                type: 'paid'
            })

            console.log('throwsPerMonth', _package.throwsPerMonth)
            if (_package.throwsPerMonth && ['quarterly', 'semi-yearly', 'yearly'].includes(_package.plan)) {
                console.log('adding', _package.plan, 'credits')
                const dates: Array<Date> = []
                const currMonth = new Date().getMonth()
                Array.from({
                    length: (_package.plan === 'quarterly' && 3) || (_package.plan === 'semi-yearly' && 6) || (_package.plan === 'yearly' && 12) || 0
                }).forEach((_, i) => {
                    dates.push(new Date(new Date().setMonth(currMonth + i)))
                })
                await Promise.all(
                    dates.map(date => Purchase.create({
                        userId: user._id,
                        stripeSubscriptionId: subscription.id,
                        credits: _package.throwsPerMonth,
                        type: 'subscription',
                        activateAfter: date
                    }))
                )
            }

            if (_package.bonusCredits) {
                Purchase.create({
                    userId: user._id,
                    stripeSubscriptionId: subscription.id,
                    credits: _package.bonusCredits,
                    type: 'subscription'
                })
            }

            resolve()
        } catch (err) {
            reject(err)
        }
    })
}

async function handleSubscriptionCancel({ subscriptionId }: { subscriptionId: string }): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const subscription = await Subscription.findOne({ stripeSubscriptionId: subscriptionId }, {}, { sort: { creationDate: -1 } })
            if (!subscription) return reject('Subscription not found')

            subscription.status = 'canceled'
            subscription.lastUpdated = new Date();
            await subscription.save()

            await Purchase.updateMany({ stripeSubscriptionId: subscription.stripeSubscriptionId }, {
                isForfeited: true,
                forfeitReason: 'Subscription cancelled',
                forfeitOn: subscription.currentPeriodEnd
            })

            resolve()
        } catch (err) {
            reject(err)
        }
    })
}

async function handlePaymentSuccess({ paymentIntent }: { paymentIntent: Stripe.PaymentIntent }): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await User.findOne({ _id: paymentIntent.metadata.userId as string })
            if (!user) return reject({ message: 'Customer not found' })

            await Purchase.create({
                userId: user._id,
                amount: paymentIntent.amount,
                credits: paymentIntent.metadata.credits,
                promocodeId: paymentIntent.metadata.promocodeId || null,
                stripeIntentId: paymentIntent.id,
                type: 'purchase',
            })
            resolve()
        } catch (err) {
            reject(err)
        }
    })
}

export {
    createCustomer,
    updateCustomer,
    handleSubscriptionSuccess,
    handleSubscriptionCancel,
    handlePaymentSuccess
}