import { NextRequest, NextResponse } from "next/server";
// import db from "../../../lib/db";
import { User } from "@/app/lib/models";
import { validateError, escapeEmailForRegex } from "@/app/lib/functions";

// const query = util.promisify(db.query).bind(db);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')
    if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 })

    try {
        const escapedEmail = escapeEmailForRegex(email);
        const user = await User.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } })

        if (user) return NextResponse.json(true, { status: 200 })
        else return NextResponse.json(false, { status: 200 })

    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
