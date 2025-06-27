import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken'
import { getServerSession, Session } from "next-auth";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { IUser } from "@/app/lib/interfaces/user";
import { AppStoreServerAPIClient, Environment, ReceiptUtility, } from "@apple/app-store-server-library"
import { ITransactionInfoApple } from "@/app/lib/interfaces/transactionInfoApple";
import { Purchase } from "@/app/lib/models";

export async function POST(req: NextRequest) {
    try {
        var session;
        const authHeader = headers().get("authorization")
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as IUser;
            if (!user._id) throw Error('Malformed JWT');
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        if (!body || !body.transactionReceipt) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });


        const issuerId = "d65f3f41-aa96-465f-9eee-002838c9f4ef"
        const keyId = "WT7MV8Z3ZN"
        const bundleId = "com.qbai.app"
        const encodedKey = process.env.APPSTORE_API_KEY as string

        const receiptUtility = new ReceiptUtility()

        const transactionId = receiptUtility.extractTransactionIdFromAppReceipt(body.transactionReceipt)
        console.log('transactionId', transactionId)
        if (!transactionId) return NextResponse.json({ message: 'Invalid Transaction Id' }, { status: 400 });


        // Function to validate the transaction in a given environment
        const validateTransaction = async (environment: Environment) => {
            const client = new AppStoreServerAPIClient(encodedKey, keyId, issuerId, bundleId, environment);
            return await client.getTransactionInfo(transactionId);
        };

        let response;
        let environment = Environment.PRODUCTION; // Try production first

        try {
            response = await validateTransaction(environment);
        } catch (error: any) {
            console.warn("Production validation failed, trying sandbox...");
            environment = Environment.SANDBOX;
            response = await validateTransaction(environment);
        }

        // const client = new AppStoreServerAPIClient(encodedKey, keyId, issuerId, bundleId, environment)
        // const response = await client.getTransactionInfo(transactionId)
        if (!response.signedTransactionInfo) return NextResponse.json({ message: 'Internal Server Error: Unable to find transaction info' }, { status: 500 });
        const info = jwt.decode(response.signedTransactionInfo) as null | ITransactionInfoApple
        console.log('info', info)
        if (!info) return NextResponse.json({ message: 'Internal Server Error: Unable to parse transaction info' }, { status: 500 });
        if (!info.purchaseDate) return NextResponse.json({ message: 'Internal Server Error: Invalid transaction info' }, { status: 500 });
        if (await Purchase.findOne({ appleTransactionId: info.transactionId })) return NextResponse.json({ message: 'A record for that transaction already exists' }, { status: 409 });

        await Purchase.create({
            userId: session.user._id,
            amount: info.price / 10,
            credits: ((info.productId === 'purchase_credits_1') && 1) || ((info.productId === 'purchase_credits_5') && 5) || ((info.productId === 'purchase_credits_10') && 10) || 0,
            appleTransactionId: info.transactionId,
            type: 'purchase',
        })

        return NextResponse.json({ message: 'Receipt has been validated' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}