export interface ISubscription {
    _id: string,
    userId: string,
    packageId: string,
    stripeSubscriptionId: string | null,
    giftedBy: string | null,
    amount: number,
    status: string,
    type: 'paid' | 'gift',
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    creationDate: Date,
    lastUpdated: Date,
}