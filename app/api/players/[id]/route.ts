import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/models";
import * as Yup from 'yup'
import crypto from "crypto";
import { validateError } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { pathname } = new URL(req.url);
        const id = pathname.split('/').pop(); // /api/players/:id
        if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })

        if (!['admin', 'trainer'].includes(session.user.role) && id !== session.user._id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

        const user = await User.findOne({ _id: id, role: 'player', isDeleted: false })
        if (!user) return NextResponse.json({ message: 'Player does not exist' }, { status: 400 })

        if (session.user.role === 'trainer' && user.roleData?.trainerId?.toString() !== session.user._id.toString()) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

        const data = await req.json()

        const schema = Yup.object({
            avatarUrl: Yup.string().optional().nullable(),
            name: Yup.string().matches(/^[A-Za-z\s]+$/, 'Name should only contain alphabets').max(40, 'Name must not be bigger than 40 characters').optional(),
            dob: Yup.date().max(new Date(), 'DoB cannot be in the future').optional(),
            height: Yup.number().min(100, `Height must be between 3'3" to 6'7"`).max(220, `Height must be between 3'3" to 6'7"`).optional().nullable().strict(),
            weight: Yup.number().min(40, 'Weight must be between 40lbs to 500lbs').max(500, 'Weight must be between 40lbs to 500lbs').optional().nullable().strict(),
            handedness: Yup.string().oneOf(['left', 'right']).optional().nullable(),
            anonymous: Yup.boolean().optional(),
            bio: Yup.string().optional().nullable(),
            city: Yup.string().optional().nullable(),
            state: Yup.string().optional().nullable(),
            country: Yup.string().optional().nullable(),
        });

        await schema.validate(data)

        if (Object.keys(data).length == 0) return NextResponse.json({ message: 'BAD REQUEST' }, { status: 400 })

        console.log('received data', data)

        if (session.user.role === 'admin') {
            user.avatarUrl = (data.avatarUrl === null ? null : data.avatarUrl || user.avatarUrl);
            user.name = (data.name || user.name);
            user.bio = (data.bio === null ? null : data.bio || user.bio);
            user.city = (data.city === null ? null : data.city || user.city);
            user.state = (data.state === null ? null : data.state || user.state);
            user.country = (data.country === null ? null : data.country || user.country);
            user.roleData = {
                dob: (data.dob === null ? null : data.dob || user.roleData.dob),
                height: (data.height === null ? null : data.height || user.roleData.height),
                handedness: (data.handedness === null ? null : data.handedness || user.roleData.handedness),
                weight: (data.weight === null ? null : data.weight || user.roleData.weight),
                anonymous: (data.anonymous !== undefined ? data.anonymous : user.roleData.anonymous),
                trainerId: user.roleData.trainerId
            }


        } 
        
        else if (session.user.role === 'trainer') {
            user.roleData = {
                ...user.roleData,
                height: (data.height === null ? null : data.height || user.roleData.height),
                handedness: (data.handedness === null ? null : data.handedness || user.roleData.handedness),
                weight: (data.weight === null ? null : data.weight || user.roleData.weight),
            }
        }
        else{
            user.avatarUrl = (data.avatarUrl === null ? null : data.avatarUrl || user.avatarUrl);
            user.name = (data.name || user.name);
            user.bio = (data.bio === null ? null : data.bio || user.bio);
            user.city = (data.city === null ? null : data.city || user.city);
            user.state = (data.state === null ? null : data.state || user.state);
            user.country = (data.country === null ? null : data.country || user.country);
            user.roleData = {
                dob: (data.dob === null ? null : data.dob || user.roleData.dob),
                height: (data.height === null ? null : data.height || user.roleData.height),
                handedness: (data.handedness === null ? null : data.handedness || user.roleData.handedness),
                weight: (data.weight === null ? null : data.weight || user.roleData.weight),
                anonymous: (data.anonymous !== undefined ? data.anonymous : user.roleData.anonymous),
                trainerId: user.roleData.trainerId
            }

        }

        await user.save()

        return NextResponse.json({ message: `Player has been updated` }, { status: 200 })
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
        const id = pathname.split('/').pop(); // /api/players/:id
        if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })

        const user = await User.findOne({ _id: id, role: 'player', isDeleted: false })
        if (!user) return NextResponse.json({ message: 'Player does not exist' }, { status: 400 })

        user.email = `${crypto.randomBytes(8).toString('hex')}@random.com`
        user.isDeleted = true

        await user.save()

        return NextResponse.json({ message: 'Player has been deleted' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}