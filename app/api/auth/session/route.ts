import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
                position: currentUser.position
            }
        });
    } catch (error) {
        console.error('GET /api/auth/session error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}