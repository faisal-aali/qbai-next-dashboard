import { NextRequest, NextResponse } from "next/server";
import { RecommendationSection } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";
import { authOption } from "../../auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        var session;
        const authHeader = headers().get("authorization")
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as Partial<IUser>;
            if (!user._id) throw Error('Malformed JWT');
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const sections = await RecommendationSection.find()

        return NextResponse.json(sections)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}