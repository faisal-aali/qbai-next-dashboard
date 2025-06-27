import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/models";
import * as Yup from 'yup'
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendEmail } from "@/app/lib/sendEmail";
import { validateError, escapeEmailForRegex } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import mongoose from "@/app/lib/mongodb";
import { PostAccountCreation } from "@/app/lib/zapier";

export async function POST(req: NextRequest) {
    try {

        const data = await req.json()

        const schema = Yup.object({
            email: Yup.string().email('Email must be valid').required("Email is required"),
            password: Yup.string().min(8, "Password must be at least 8 characters").optional(),
            name: Yup.string().matches(/^[A-Za-z\s]+$/, 'Name should only contain alphabets').max(40, 'Name must not be bigger than 40 characters').required("Name is required"),
            avatarUrl: Yup.string().optional(),
            dob: Yup.date().max(new Date(), 'DoB cannot be in the future').optional(),
            height: Yup.number().min(100, `Height must be between 3'3" to 6'7"`).max(220, `Height must be between 3'3" to 6'7"`).required(),
            weight: Yup.number().min(40, 'Weight must be between 40lbs to 500lbs').max(500, 'Weight must be between 40lbs to 500lbs').required(),
            handedness: Yup.string().oneOf(['left', 'right']).required(),
            city: Yup.string().optional(),
            state: Yup.string().optional(),
            country: Yup.string().optional(),
            emailVerified: Yup.boolean().optional(),
            registrationPlatform: Yup.string().oneOf(['app', 'web']).optional(),
        });

        await schema.validate(data)

        const randomPassword = data.password ? undefined : crypto.randomBytes(4).toString("hex");

        const escapedEmail = escapeEmailForRegex(data.email);
        const dups = await User.find({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } })
        if (dups.length > 0) return NextResponse.json({ message: 'The email has already been registered.' }, { status: 400 })

        let trainerId = null
        const session = await getServerSession(authOption);
        if (session && session.user && session.user.role === 'trainer') trainerId = new mongoose.Types.ObjectId(session.user._id)

        const user = await User.create({
            email: data.email.toLowerCase().trim(),
            password: bcrypt.hashSync((data.password || randomPassword), process.env.BCRYPT_SALT as string),
            name: data.name,
            avatarUrl: data.avatarUrl,
            city: data.city,
            state: data.state,
            country: data.country,
            registrationPlatform: data.registrationPlatform || 'web',
            emailVerified: data.emailVerified,
            role: 'player',
            roleData: {
                dob: data.dob,
                height: Number(data.height),
                weight: Number(data.weight),
                handedness: data.handedness,
                anonymous: false,
                trainerId: trainerId
            }
        })

        if (randomPassword) {
            sendEmail({
                to: data.email,
                subject: 'Welcome to Spin Lab AI',
                html: `
                    <p>Hello, ${data.name}!</p>
                    <p>Please use the following credentials to login to the dashboard</p>
                    <p>Email: ${data.email}</p>
                    <p>Password: ${randomPassword}</p>
                `
            }).catch(console.error)
        }

        PostAccountCreation(user._id.toString()).catch(err => console.error('[Zapier] FATAL ERROR:', err))

        return NextResponse.json({ message: `Player has been created with id ${user._id}` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}