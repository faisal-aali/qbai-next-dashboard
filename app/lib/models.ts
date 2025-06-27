import mongoose from './mongodb'
import { IUser } from './interfaces/user';
import { IDrill } from './interfaces/drill';
import { ICategory } from './interfaces/category';
import { IVideo } from './interfaces/video';
import { IPackage } from './interfaces/package';
import { ISubscription } from './interfaces/subscription';
import { IPurchase } from './interfaces/purchase';
import { ICalendar } from './interfaces/calendar';
import { INotification } from './interfaces/notification';
import { IPromocode } from './interfaces/promocode';
import { IRequest } from './interfaces/request';
import { IAppleTransactions } from './interfaces/appleTransactions';
import { ITicket } from './interfaces/ticket';
import { ITicketMessage } from './interfaces/ticketMessage';
import { IRecommendationCriteria } from './interfaces/recommendationCriteria';
import { IRecommendationSection } from './interfaces/recommendationSection';

// const roleDataSchema = new mongoose.Schema({
//     age: { type: Number, required: false, default: null },
//     height: { type: Number, required: false, default: null },
//     weight: { type: Number, required: false, default: null },
//     handedness: { type: String, required: false, default: null },
//     anonymous: { type: Boolean, required: false, default: false },
// }, { _id: false }); // Disable _id for sub-documents

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    city: { type: String, required: false, default: null },
    state: { type: String, required: false, default: null },
    country: { type: String, required: false, default: null },
    avatarUrl: { type: String, required: false, default: null },
    bio: { type: String, required: false, default: null },
    emailVerified: { type: Boolean, required: false, default: false },
    stripeCustomerId: { type: String, required: false, default: null },
    registrationPlatform: { type: String, required: true, default: 'web', enum: ['app', 'web'] },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
    role: { type: String, required: true, enum: ['player', 'trainer', 'staff', 'admin'] },
    roleData: { type: mongoose.Schema.Types.Mixed, required: true },
    isDeleted: { type: Boolean, required: false, default: false },
}, { minimize: false }); // minimize false in order to store empty objects

const drillSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true, },
    videoLink: { type: String, required: true },
    title: { type: String, required: true, },
    videoTranscription: { type: String, required: false, default: null },
    videoEmbedding: { type: [Number], required: false, default: null },
    description: { type: String, required: true, },
    isFree: { type: Boolean, required: true },
    thumbnailUrl: { type: String, required: false, default: null },
    recommendationCriteria: { type: Array<Object>, required: false, default: null },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
});



const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
});

const videoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    taskId: { type: String, required: true, unique: true },
    assessmentMappingId: { type: String, required: true, unique: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    thumbnailUrl: { type: String, required: false, default: null },
    taskType: { type: String, required: true, default: 'qbthrow' },
    deliveryDate: { type: Date, required: true },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
    assessmentDetails: { type: mongoose.Schema.Types.Mixed, required: false, default: {} },
    framerate: { type: Number, required: true },
    isDeleted: { type: Boolean, required: false, default: false },
    motionApiVersion: { type: String, required: true, enum: ['legacy', 'core'] },
}, { minimize: false });

const packageSchema = new mongoose.Schema({
    stripePlanId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    role: { type: String, required: true, enum: ['player', 'trainer'] },
    throwsPerMonth: { type: Number, required: true },
    amountPerCredit: { type: Number, required: true },
    amount: { type: Number, required: true },
    plan: { type: String, required: true, enum: ['quarterly', 'half-yearly', 'yearly', 'free'] },
    bonusCredits: { type: Number, required: true },
});

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, required: true },
    stripeSubscriptionId: { type: String, required: false, default: null },
    giftedBy: { type: mongoose.Schema.Types.ObjectId, required: false, default: null },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    type: { type: String, required: true, enum: ['paid', 'gift'] },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
    lastUpdated: { type: Date, required: false, default: () => new Date().toISOString() },
}, { minimize: false });

const purchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    stripeSubscriptionId: { type: String, required: false, default: null },
    stripeIntentId: { type: String, required: false, default: null },
    appleTransactionId: { type: String, required: false, default: null },
    promocodeId: { type: mongoose.Schema.Types.ObjectId, required: false, default: null },
    amount: { type: Number, required: false, default: 0 },
    credits: { type: Number, required: true },
    type: { type: String, required: true, enum: ['purchase', 'subscription', 'gift', 'promocode'] },
    giftedBy: { type: mongoose.Schema.Types.ObjectId, required: false, default: null },
    isForfeited: { type: Boolean, required: false, default: false },
    forfeitReason: { type: String, required: false, default: null },
    forfeitDate: { type: Date, required: false, default: null },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
    activateAfter: { type: Date, required: false, default: () => new Date().toISOString() },
}, { minimize: false });

const calendarSchema = new mongoose.Schema({
    src: { type: String, required: true },
});

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    isRead: { type: Boolean, required: false, default: false },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
});

const promocodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    discountPercentage: { type: Number, required: false, default: null },
    claimCredits: { type: Number, required: false, default: null },
    uses: { type: Number, required: true },
    type: { type: String, required: true, enum: ['purchase_discount', 'free_credits'] },
    productId: { type: mongoose.Schema.Types.ObjectId, required: false, default: null },
    showPopup: { type: Boolean, required: false, default: false },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
    expirationDate: { type: Date, required: true },
    isDeleted: { type: Boolean, required: false, default: false },
});

const requestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    requestType: { type: String, required: true, enum: ['video_deletion'] },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    isViewed: { type: Boolean, required: false, default: false },
    action: { type: String, required: true, enum: ['pending', 'rejected', 'accepted'], default: 'pending' },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
});

const appleTransactionsSchema = new mongoose.Schema({
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
});

const ticketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    ticketId: { type: String, required: true },
    // message: { type: String, required: true }, @deprecated
    // attachments: { type: Array<String>, required: true, default: [] }, @deprecated
    // viewedBy: { type: Array<String>, required: true, default: [] }, @deprecated
    status: { type: String, required: true, enum: ['open', 'closed'], default: 'open' },
    platform: { type: String, required: true, enum: ['web', 'app'] },
    // comment: { type: String, required: false, default: null }, @deprecated
    closedBy: { type: mongoose.Schema.Types.ObjectId, required: false, default: null },
    closingDate: { type: Date, required: false, default: null },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
}, { minimize: false });

const ticketMessageSchema = new mongoose.Schema({
    ticketObjectId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
    message: { type: String, required: true },
    attachments: { type: Array<String>, required: true, default: [] },
    viewedBy: { type: Array<String>, required: true, default: [] },
    creationDate: { type: Date, required: false, default: () => new Date().toISOString() },
}, { minimize: false });

const recommendationCriteriaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    range: { type: Array<Number>, required: true },
    attribute: { type: String, required: false },
    calculationType: { type: String, required: true, enum: ['custom_knee_flexion_delta', 'absolute'] },
}, { minimize: false });

const recommendationSectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    criteriaIds: { type: Array<String>, required: true },
});

// Middleware to auto-increment ticketId
ticketSchema.pre('save', async function (next) {
    if (this.isNew) {
        console.log('ticket pre save called')
        const lastTicket = await Ticket.findOne().sort({ ticketId: -1 });

        let newTicketId = 1; // Default if no previous ticket exists
        if (lastTicket) {
            newTicketId = parseInt(lastTicket.ticketId, 10) + 1;
        }

        this.ticketId = newTicketId.toString().padStart(5, '0'); // Ensures 5-digit format
    }
    next();
});

export const User: mongoose.Model<IUser> = mongoose.models.user || mongoose.model<IUser>('user', userSchema, 'users');

export const Drill: mongoose.Model<IDrill> = mongoose.models.drill || mongoose.model<IDrill>('drill', drillSchema, 'drills');

// Create indexes if they don't exist
Drill.collection.createIndex({ title: 'text', description: 'text' }).catch(console.error);
Drill.collection.createIndex(
    { videoEmbedding: 1 }
).catch(console.error);
Drill.collection.createIndex({ categoryId: 1 }).catch(console.error);

export const Category: mongoose.Model<ICategory> = mongoose.models.category || mongoose.model<ICategory>('category', categorySchema, 'categories');

export const Video: mongoose.Model<IVideo> = mongoose.models.video || mongoose.model<IVideo>('video', videoSchema, 'videos');

export const Package: mongoose.Model<IPackage> = mongoose.models.package || mongoose.model<IPackage>('package', packageSchema, 'packages');

export const Subscription: mongoose.Model<ISubscription> = mongoose.models.subscription || mongoose.model<ISubscription>('subscription', subscriptionSchema, 'subscriptions');

export const Purchase: mongoose.Model<IPurchase> = mongoose.models.purchase || mongoose.model<IPurchase>('purchase', purchaseSchema, 'purchases');

export const Calendar: mongoose.Model<ICalendar> = mongoose.models.calendar || mongoose.model<ICalendar>('calendar', calendarSchema, 'calendars');

export const Notification: mongoose.Model<INotification> = mongoose.models.notification || mongoose.model<INotification>('notification', notificationSchema, 'notifications');

export const Promocode: mongoose.Model<IPromocode> = mongoose.models.promocode || mongoose.model<IPromocode>('promocode', promocodeSchema, 'promocodes');

export const Request: mongoose.Model<IRequest> = mongoose.models.request || mongoose.model<IRequest>('request', requestSchema, 'requests');

export const AppleTransactions: mongoose.Model<IAppleTransactions> = mongoose.models.appleTransactions || mongoose.model<IAppleTransactions>('appleTransactions', appleTransactionsSchema, 'apple_transactions');

export const Ticket: mongoose.Model<ITicket> = mongoose.models.ticket || mongoose.model<ITicket>('ticket', ticketSchema, 'tickets');

export const TicketMessage: mongoose.Model<ITicketMessage> = mongoose.models.ticketMessage || mongoose.model<ITicketMessage>('ticketMessage', ticketMessageSchema, 'tickets_messages');

export const RecommendationCriteria: mongoose.Model<IRecommendationCriteria> = mongoose.models.recommendationCriteria || mongoose.model<IRecommendationCriteria>('recommendationCriteria', recommendationCriteriaSchema, 'recommendations_criteria');

export const RecommendationSection: mongoose.Model<IRecommendationSection> = mongoose.models.recommendationSection || mongoose.model<IRecommendationSection>('recommendationSection', recommendationSectionSchema, 'recommendations_sections');