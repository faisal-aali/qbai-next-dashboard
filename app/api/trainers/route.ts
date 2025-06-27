import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/models";
import * as Yup from 'yup'
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendEmail } from "@/app/lib/sendEmail";
import { validateError, escapeEmailForRegex } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { PostAccountCreation } from "@/app/lib/zapier";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        const staff = (session && session.user && session.user.role === 'staff') ? await User.findOne({ _id: session?.user._id }) : undefined

        const data = await req.json()

        const schema = Yup.object({
            email: Yup.string().email('Email must be valid').required("Email is required"),
            password: Yup.string().min(8, "Password must be at least 8 characters").optional(),
            name: Yup.string().matches(/^[A-Za-z\s]+$/, 'Name should only contain alphabets').max(40, 'Name must not be bigger than 40 characters').required("Name is required"),
            avatarUrl: Yup.string().optional(),
            city: Yup.string().optional(),
            state: Yup.string().optional(),
            country: Yup.string().optional(),
            emailVerified: Yup.boolean().optional(),
        });

        await schema.validate(data)

        const randomPassword = data.password || staff ? undefined : crypto.randomBytes(4).toString("hex");

        const escapedEmail = escapeEmailForRegex(data.email);
        const dups = await User.find({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } })
        if (dups.length > 0) return NextResponse.json({ message: 'The email has already been registered.' }, { status: 400 })

        const user = await User.create({
            email: data.email.toLowerCase().trim(),
            password: staff ? staff.password : bcrypt.hashSync((data.password || randomPassword), process.env.BCRYPT_SALT as string),
            name: data.name,
            avatarUrl: data.avatarUrl,
            city: data.city,
            state: data.state,
            country: data.country,
            emailVerified: data.emailVerified,
            role: 'trainer',
            roleData: {}
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

        if (staff) {
            staff.roleData = {
                ...staff.roleData,
                linkedUserId: user._id
            }
            await staff.save()
            user.roleData = {
                ...user.roleData,
                linkedUserId: staff._id,
            }
            await user.save()
        }

        PostAccountCreation(user._id.toString()).catch(err => console.error('[Zapier] FATAL ERROR:', err))

        return NextResponse.json({ message: `Trainer has been created with id ${user._id}` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}