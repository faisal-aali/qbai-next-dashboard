import { NextRequest, NextResponse } from "next/server";
// import db from "../../../lib/db";
import { User } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError, escapeEmailForRegex } from "@/app/lib/functions";
import { generateOtp, verifyOtp } from "@/app/lib/otps";
import { sendEmail } from "@/app/lib/sendEmail";

// const query = util.promisify(db.query).bind(db);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const otp = Number(searchParams.get('otp'))
        if (!otp) return NextResponse.json({ message: 'OTP is required' }, { status: 400 })

        if (verifyOtp(otp, false)) return NextResponse.json(true, { status: 200 })
        else return NextResponse.json(false, { status: 200 })

    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}

export async function POST(req: NextRequest) {
    try {
        
        const data = await req.json()

        const schema = Yup.object({
            email: Yup.string().email('Email must be valid').required("Email is required"),
            receiverEmail: Yup.string().email('Receiver Email must be valid').optional(),
        });

        await schema.validate(data)

        const escapedEmail = escapeEmailForRegex(data.email);
        const user = await User.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } })
        if (!user) return NextResponse.json({ message: `The email is not registered` }, { status: 404 })

        const code = generateOtp(user._id.toString())

        console.log('/users/sendOTP code:', code)

        await sendEmail({
            to: data.receiverEmail || data.email,
            subject: 'Verification Code',
            html: `
                <p>Hello, ${user.name}!</p>
                <p>Please enter the following code on the website. This code will expire in 15 minutes.</p>
                <p>Code: ${code}</p>
            `
        })

        return NextResponse.json({ message: `Code has been sent on the email` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
