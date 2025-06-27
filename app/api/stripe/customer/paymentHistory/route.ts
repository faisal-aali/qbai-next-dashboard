import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { authOption } from "../../../auth/[...nextauth]/route";
import { User } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { PDFDocument, StandardFonts } from 'pdf-lib';

const stripeSecretKey: string = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecretKey);

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOption);
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const user = await User.findOne({ _id: session.user._id })
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
        if (!user.stripeCustomerId) return NextResponse.json({ message: 'Stripe profile not found' }, { status: 404 })

        // Fetch payment history for the customer
        const payments = await stripe.paymentIntents.list({
            customer: user.stripeCustomerId,
            limit: 100,
        });

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 12;

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let yPosition = height - fontSize * 2;

        page.drawText('Payment History', { x: 50, y: yPosition, size: fontSize * 2, font });

        yPosition -= fontSize * 2;

        payments.data.forEach((payment) => {
            const date = new Date(payment.created * 1000).toLocaleDateString();
            const amount = (payment.amount / 100).toFixed(2);
            const currency = payment.currency.toUpperCase();
            const status = payment.status;

            page.drawText(`Date: ${date}`, { x: 50, y: yPosition, size: fontSize, font });
            page.drawText(`Amount: ${amount} ${currency}`, { x: 200, y: yPosition, size: fontSize, font });
            page.drawText(`Status: ${status}`, { x: 400, y: yPosition, size: fontSize, font });

            yPosition -= fontSize * 1.5;

            if (yPosition < fontSize * 2) {
                yPosition = height - fontSize * 2;
                pdfDoc.addPage();
            }
        });

        const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            statusText: "OK",
        });

    } catch (err) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
