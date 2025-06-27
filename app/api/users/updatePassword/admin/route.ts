import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
// import db from "../../../lib/db";
import { User } from "@/app/lib/models";
import { getServerSession } from "next-auth";
import * as Yup from 'yup'
import { sendEmail } from "@/app/lib/sendEmail";
import { validateError } from "@/app/lib/functions";
import { authOption } from "@/app/api/auth/[...nextauth]/route";
// const query = util.promisify(db.query).bind(db);

export async function PATCH(req: NextRequest, res: NextResponse) {
  try {
    const session = await getServerSession(authOption);
    if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const data = await req.json();

    const schema = Yup.object({
      id: Yup.string().required("Id is required"),
      password: Yup.string().required("New Password is required").min(8, "Password must be at least 8 characters"),
    });

    await schema.validate(data)

    const user = await User.findOne({ _id: data.id })
    if (!user) return NextResponse.json({ message: 'User does not exist' }, { status: 404 })

    user.password = bcrypt.hashSync(data.password, process.env.BCRYPT_SALT as string)
    await user.save()

    sendEmail({
      to: user.email,
      subject: 'Password has been updated',
      html: `
          <p>Hello, ${user.name}!</p>
          <p>This is to notify you that your password has been updated by an administrator.</p>
      `
    }).catch(console.error)

    return NextResponse.json({ message: 'Password has been updated' })

  } catch (err: unknown) {
    console.error(err)
    const obj = validateError(err)
    return NextResponse.json({ message: obj.message }, { status: obj.status })
  }
}
