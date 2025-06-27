import { NextRequest, NextResponse } from "next/server";
import { User, Subscription, Package, Video, Purchase } from "@/app/lib/models";
import * as Yup from 'yup'
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendEmail } from "@/app/lib/sendEmail";
import { calculateCredits, validateError } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import mongoose from "@/app/lib/mongodb";
import { IVideo } from "@/app/lib/interfaces/video";
import axios from 'axios'
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";
import { authOption } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id')
    const role = searchParams.get('role')
    const trainerId = searchParams.get('trainerId')

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

        const query: { isDeleted: boolean, role?: string, _id?: mongoose.Types.ObjectId, 'roleData.trainerId'?: mongoose.Types.ObjectId } = {
            isDeleted: false
        };

        if (id) query._id = new mongoose.Types.ObjectId(id);
        if (role) query.role = role;
        if (trainerId) query['roleData.trainerId'] = new mongoose.Types.ObjectId(trainerId);

        const users = await User.find(query, { name: 1, _id: 1 });

        return NextResponse.json(users)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}