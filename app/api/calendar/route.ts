import { NextRequest, NextResponse } from "next/server";
import { Calendar, Category } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
    try {
        const calendar = await Calendar.findOne()
        return NextResponse.json(calendar)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json()
        if (!body.src) return NextResponse.json({ message: 'Src is required' }, { status: 400 })
        await Calendar.updateMany({}, { src: body.src })
        return NextResponse.json({ message: 'Updated' })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}