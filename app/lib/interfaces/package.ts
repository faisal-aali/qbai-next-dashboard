
export interface IPackage {
    _id: string,
    stripePlanId: string,
    name: string,
    description: string,
    role: string,
    throwsPerMonth: number,
    amountPerCredit: number,
    amount: number,
    plan: string,
    bonusCredits: number
}