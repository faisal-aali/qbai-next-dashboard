import NextAuth, { DefaultSession } from "next-auth"
import { IUser } from '../lib/interfaces/user'

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: DefaultSession["user"] & {
            _id: string,
            name: string,
            role: string,
            emailVerified: boolean,
        }
    }
    interface User<IUser> { }
}