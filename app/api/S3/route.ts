import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, User } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { uploadFileToS3 } from "@/app/lib/aws";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";

export async function POST(req: NextRequest) {
    try {
        var session;
        const authHeader = headers().get("authorization")
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as IUser;
            if (!user._id) throw Error('Malformed JWT');
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const contentType = req.headers.get('content-type');

        let file, name, isBase64 = 0;

        if (contentType === 'application/json') {
            // Handle JSON request
            const body = await req.json();
            console.log('[s3] json received')
            file = body.file
            name = body.name
            isBase64 = body.isBase64 ? Number(body.isBase64) : 0
        } else if (contentType?.startsWith('multipart/form-data')) {
            // Handle form-data request
            const formData = await req.formData()
            console.log('[s3] formData received')
            file = formData.get('file')
            name = (file as File).name
        } else {
            return new Response(JSON.stringify({ error: 'Unsupported Content-Type' }), { status: 415 });
        }

        if (!file) return NextResponse.json({ message: 'File is required' }, { status: 400 });

        // console.log('file', file)
        const url = await uploadFileToS3(file, name, isBase64)

        return NextResponse.json({ url }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}