import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
// import db from "../../../lib/db";
import { User } from "@/app/lib/models";
import { getServerSession } from "next-auth";
import * as Yup from 'yup'
import { authOption } from "../../auth/[...nextauth]/route";
import { sendEmail } from "@/app/lib/sendEmail";
import { validateError } from "@/app/lib/functions";
// const query = util.promisify(db.query).bind(db);

export async function PATCH(req: NextRequest, res: NextResponse) {
  try {
    const session = await getServerSession(authOption);
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const data = await req.json();

    const schema = Yup.object({
      oldPassword: Yup.string().required("Old Password is required").min(8, "Password must be at least 8 characters"),
      newPassword: Yup.string().required("New Password is required").min(8, "Password must be at least 8 characters"),
    });

    await schema.validate(data)

    const { oldPassword, newPassword } = data

    if (oldPassword === newPassword) return NextResponse.json({ message: 'Old password cannot be the same as new password' }, { status: 400 })

    const user = await User.findOne({ _id: session.user._id })
    if (!user) return NextResponse.json({ message: 'User does not exist' }, { status: 404 })

    // if (bcrypt.hashSync(oldPassword, process.env.BCRYPT_SALT as string) !== user.password) {
    //   return NextResponse.json({ message: 'Old password is incorrect' }, { status: 400 })
    // }

    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return NextResponse.json({ message: 'Old password is incorrect' }, { status: 400 })
    }

    user.password = bcrypt.hashSync(newPassword, process.env.BCRYPT_SALT as string)
    await user.save()

    sendEmail({
      to: user.email,
      subject: 'Password has been updated',
      html: `
          <p>Hello, ${user.name}!</p>
          <p>This is to notify you that your password has been updated. If you do not recognize this action, please contact an administrator.</p>
      `
    }).catch(console.error)

    return NextResponse.json({ message: 'Password has been updated' })

  } catch (err: unknown) {
    console.error(err)
    const obj = validateError(err)
    return NextResponse.json({ message: obj.message }, { status: obj.status })
  }
}
