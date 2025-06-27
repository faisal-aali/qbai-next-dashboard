import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/models";
import crypto from "crypto";
import { validateError } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { pathname } = new URL(req.url);
        const id = pathname.split('/').pop(); // /api/users/:id
        if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })

        const user = await User.findOne({ _id: id, isDeleted: false })
        if (!user) return NextResponse.json({ message: 'User does not exist' }, { status: 400 })

        user.email = `${crypto.randomBytes(8).toString('hex')}@random.com`
        user.isDeleted = true

        await user.save()

        const linkedUser = await User.findOne({ 'roleData.linkedUserId': user._id })
        console.log('linkedUser', linkedUser)
        if (linkedUser) {
            linkedUser.roleData = {
                ...linkedUser.roleData,
                linkedUserId: null
            }
            await linkedUser.save()
        }

        return NextResponse.json({ message: 'User has been deleted' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}