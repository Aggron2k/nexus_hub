// app/api/users/me/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Érzékeny adatok eltávolítása
        const { hashedPassword, ...safeUser } = currentUser;

        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('GET /api/users/me error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
