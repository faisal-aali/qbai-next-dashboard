import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/models";
import bcrypt from 'bcrypt'
import { validateError, escapeEmailForRegex } from "@/app/lib/functions";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = headers().get("authorization") as string;
        if (!authHeader) return NextResponse.json({ message: 'Auth header is required' }, { status: 400 });
        console.log('authHeader is', authHeader)
        if (!authHeader.startsWith('Basic ')) return NextResponse.json({ message: 'Authorization header must be Basic' }, { status: 400 });

        const base64Credentials = authHeader.split('Basic ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');
        if (!username || !password) return NextResponse.json({ message: 'Email and password is required' }, { status: 400 });
        console.log(username, password)
        const escapedEmail = escapeEmailForRegex(username);
        const user = await User.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } });

        if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });

        const tokenExpiry = new Date(new Date().getTime() + 86400000).toISOString()
        const jwtToken = jwt.sign({ _id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified }, process.env.NEXTAUTH_SECRET as string, { expiresIn: '24h' });

        // user.jwtToken = jwtToken
        // await user.save()

        return NextResponse.json({ jwtToken, expires: tokenExpiry });
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
