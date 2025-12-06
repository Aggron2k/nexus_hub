import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname, search } = req.nextUrl;

        // Ha a főoldalon vagyunk és van query paraméter (bejelentkezési adatok)
        if (pathname === "/" && search.includes("email") || search.includes("password")) {
            // Redirect tiszta URL-re
            const cleanUrl = new URL("/", req.url);
            return NextResponse.redirect(cleanUrl);
        }

        // Ha bejelentkezett felhasználó próbál a főoldalra menni
        if (pathname === "/" && req.nextauth.token) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/",
            signOut: "/",
            error: "/",
        },
    }
);

export const config = {
    matcher: [
        // Protected routes - only accessible when logged in
        "/dashboard/:path*",
        "/users/:path*",
        "/documents/:path*",
        "/todos/:path*",
        "/messages/:path*",
        "/schedule/:path*",
        "/payroll/:path*",
        "/time-off/:path*",
        "/my-requests/:path*",
        // Include home page for cleanup and redirect
        "/",
    ],
};