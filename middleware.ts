import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/", // A nem bejelentkezett felhasználók átirányítása ide
        signOut: "/", // Kijelentkezés után ide irányít
        error: "/", // Hiba esetén átirányítás (pl. authentikációs hiba)
    },
});

export const config = {
    matcher: [
        "/users/:path*",
        "/conversations/:path*",
        "/dashboard/:path*",
        "/documents/:path*",
        "/tasks/:path*",
    ],
};
