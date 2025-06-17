import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Csak Manager+ láthatja az összes felhasználót
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
        if (!isManager) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                position: true,
                createdAt: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('GET /api/users error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}