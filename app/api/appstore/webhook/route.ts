import { NextRequest, NextResponse } from "next/server";
import { validateError } from "@/app/lib/functions";
import jwt from 'jsonwebtoken'
import { AppleTransactions } from "@/app/lib/models";
interface DecodedJWT {
    payload: {
        data?: {
            signedTransactionInfo?: string;
        };
    };
}

export async function POST(req: NextRequest) {
    try {
        console.log('[/api/appstore/webhook] called')
        const data = await req.json()

        console.log('[/api/appstore/webhook] data', data)

        if (!data || !data.signedPayload) return NextResponse.json({ message: 'Invalid Request' }, { status: 400 })

        const decoded = jwt.decode(data.signedPayload, { complete: true }) as DecodedJWT | null;

        if (!decoded?.payload?.data?.signedTransactionInfo) return NextResponse.json({ message: 'Invalid Request' }, { status: 400 })

        const transactionInfo = jwt.decode(decoded.payload.data.signedTransactionInfo, { complete: true });

        console.log(transactionInfo)

        await AppleTransactions.create({ data: transactionInfo })

        return NextResponse.json({ message: `Done` }, { status: 200 })
    } catch (err: unknown) {
        console.error(new Date(), '[/api/appstore/webhook] error:', err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}