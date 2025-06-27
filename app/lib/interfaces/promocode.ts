import mongoose from "../mongodb";

export interface IPromocode {
    _id: mongoose.Schema.Types.ObjectId,
    code: string,
    description: string,
    discountPercentage: number,
    claimCredits: number,
    uses: number,
    type: string,
    productId: mongoose.Schema.Types.ObjectId | null,
    showPopup: boolean,
    creationDate: Date,
    expirationDate: Date,
    isDeleted: boolean
}