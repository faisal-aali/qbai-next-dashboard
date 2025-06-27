import mongoose from "../mongodb";

interface IRoleData {
    dob: Date | null;
    height: number | null;
    weight: number | null;
    handedness: 'left' | 'right' | null; // Example of a string union type
    anonymous: boolean | null;
    trainerId: mongoose.Schema.Types.ObjectId | null;
    linkedUserId?: mongoose.Schema.Types.ObjectId | null;
}

export interface ICredit {
    purchased: number,
    used: number,
    remaining: number
}
export interface IUser {
    _id: mongoose.Schema.Types.ObjectId,
    name: string,
    email: string,
    password: string,
    city: string | null,
    state: string | null,
    country: string | null,
    avatarUrl: string | null,
    bio: string | null,
    credits: ICredit,
    emailVerified: boolean,
    stripeCustomerId: string | null,
    registrationPlatform: string | null,
    creationDate: Date,
    role: string,
    roleData: IRoleData,
    isDeleted: boolean
}