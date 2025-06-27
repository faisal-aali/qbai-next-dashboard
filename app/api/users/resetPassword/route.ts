import { NextRequest, NextResponse } from "next/server";
// import db from "../../../lib/db";
import { User } from "@/app/lib/models";
import * as Yup from 'yup'
import bcrypt from 'bcrypt'
import { validateError } from "@/app/lib/functions";
import { verifyOtp } from "@/app/lib/otps";
import { sendEmail } from "@/app/lib/sendEmail";

// const query = util.promisify(db.query).bind(db);

export async function PATCH(req: NextRequest) {
    try {
        const data = await req.json()

        const schema = Yup.object({
            otp: Yup.number().required("OTP is required"),
            password: Yup.string().min(8, "Password must be at least 8 characters").required('Password is required'),
        });

        await schema.validate(data)

        const otp = verifyOtp(data.otp)
        if (!otp) return NextResponse.json({ message: `Invalid OTP provided` }, { status: 400 })

        const user = await User.findOne({ _id: otp.id })
        if (!user) return NextResponse.json({ message: `User does not exist` }, { status: 404 })

        user.password = bcrypt.hashSync(data.password, process.env.BCRYPT_SALT as string);
        await user.save()

        sendEmail({
            to: user.email,
            subject: 'Password has been reset',
            html: `
                <p>Hello, ${user.name}!</p>
                <p>This is to notify you that your password has been reset. If you do not recognize this action, please contact an administrator.</p>
            `
        }).catch(console.error)

        return NextResponse.json({ message: `Password has been reset` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
