import { NextRequest, NextResponse } from "next/server";
import { Promocode } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { pathname } = new URL(req.url);
        const id = pathname.split('/').pop(); // /api/promocodes/:id
        if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })

        const data = await req.json()

        const schema = Yup.object({
            showPopup: Yup.boolean().required("showPopup is required"),
        });

        await schema.validate(data)

        const promocode = await Promocode.findOne({ _id: id })
        if (!promocode) return NextResponse.json({ message: 'Invalid promocode Id' }, { status: 404 });

        promocode.showPopup = data.showPopup

        await promocode.save()

        return NextResponse.json({ message: 'Promocode has been updated' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { pathname } = new URL(req.url);
        const id = pathname.split('/').pop(); // /api/promocodes/:id
        if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })

        const promocode = await Promocode.findOne({ _id: id })
        if (!promocode) return NextResponse.json({ message: 'Invalid promocode Id' }, { status: 404 });

        promocode.code = crypto.randomUUID()
        promocode.isDeleted = true

        await promocode.save()

        return NextResponse.json({ message: 'Promocode has been deleted' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}