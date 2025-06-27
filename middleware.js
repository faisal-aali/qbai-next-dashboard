// import { NextRequest, NextResponse } from "next/server";
// // import { getServerSession } from 'next-auth'
// // import { authOption } from './app/api/auth/[...nextauth]/route'


// export default async function middleware(req, res) {
//     // const session = await getServerSession(req, res)

//     // console.log(session)

//     let verify = req.cookies.get("loggedin");
//     let url = req.url;

//     // console.log('[middleware]', verify, url, session)

//     const isProtectedRoute = protectedRoutes.some(route => url.includes(route));
//     if (!verify && isProtectedRoute) {
//         return NextResponse.redirect("http://localhost:3000/login");
//     }
//     if (verify && url === "http://localhost:3000/") {
//         return NextResponse.redirect("http://localhost:3000/dashboard");
//     }
//     if (verify && (url.includes("/login") || url.includes("/register"))) {
//         return NextResponse.redirect("http://localhost:3000/dashboard");
//     }
//     if (url === "http://localhost:3000/") {
//         return NextResponse.redirect("http://localhost:3000/login");
//     }
//     return NextResponse.next();
// }

const protectedRoutes = [
    '/dashboard',
    '/leaderboard',
    '/drill-library',
    '/metrics',
    '/history',
    '/coachingCall',
    '/purchases',
    '/subscriptions',
    '/settings',
];

export { default } from "next-auth/middleware"

export const config = { matcher: ['/dashboard', '/players-history', '/settings'] }

