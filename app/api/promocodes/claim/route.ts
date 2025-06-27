import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, Promocode, Purchase, User } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { IPurchase } from "@/app/lib/interfaces/purchase";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || !['player', 'trainer'].includes(session.user.role)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const data = await req.json()

        const schema = Yup.object({
            code: Yup.string().required("Code is required"),
        });

        await schema.validate(data)

        data.code = data.code.toUpperCase().trim()

        const promocodes = await Promocode.aggregate([
            { $match: { code: data.code, isDeleted: false } },
            {
                $lookup: {
                    from: "purchases",               // The collection to join
                    localField: "_id",               // Field from the `promocodes` collection
                    foreignField: "promocodeId",     // Field from the `purchases` collection
                    as: "products"                  // The resulting array field in the output
                }
            },
        ])

        const promocode = promocodes[0]
        if (!promocode || promocode.type !== 'free_credits') return NextResponse.json({ message: "Invalid promo code provided" }, { status: 400 });
        console.log(promocode.products)
        if (promocode.products.some((purchase: IPurchase) => purchase.userId.toString() === session.user._id.toString())) return NextResponse.json({ message: "You have already claimed that promo code" }, { status: 400 });
        if (new Date(promocode.expirationDate).getTime() < new Date().getTime()) return NextResponse.json({ message: "Promo code has expired" }, { status: 400 });
        if (promocode.products.length >= promocode.uses) return NextResponse.json({ message: "Promo code has reached usage limit" }, { status: 400 });

        await Purchase.create({
            userId: session.user._id,
            amount: 0,
            credits: promocode.claimCredits,
            promocodeId: promocode._id,
            stripeIntentId: null,
            type: 'promocode',
        })

        return NextResponse.json({ message: `Promocode has been claimed successfully` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}