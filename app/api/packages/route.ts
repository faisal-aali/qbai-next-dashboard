import { NextRequest, NextResponse } from "next/server";
import { Package } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id')
    const role = searchParams.get('role')
    const plan = searchParams.get('plan')

    try {

        const query: { _id?: string, role?: string, plan?: string } = {};

        if (id) query._id = id;
        if (role) query.role = role;
        if (plan) query.plan = plan;

        const _package = await Package.find(query) //note: package is reserved word
        return NextResponse.json(_package)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}