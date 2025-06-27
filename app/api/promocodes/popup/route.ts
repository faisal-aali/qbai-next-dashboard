import { NextRequest, NextResponse } from "next/server";
import { Promocode, Purchase } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const promocodes = await Promocode.aggregate([
            { $match: { showPopup: true, isDeleted: false, expirationDate: { $gt: new Date() } } },
            {
                $lookup: {
                    from: "purchases",               // The collection to join
                    localField: "_id",               // Field from the `promocodes` collection
                    foreignField: "promocodeId",     // Field from the `purchases` collection
                    as: "products"                  // The resulting array field in the output
                }
            },
        ])

        return NextResponse.json(promocodes.filter(promo => promo.products.length < promo.uses))
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}