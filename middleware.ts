import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/dashboard",
    }
});

export const config = {
    matcher: [
        "/users/:path*",
        "/conversations/:path*",
        "/dashboard/:path*",
    ]
};