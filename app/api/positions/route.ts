import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

// GET - Összes pozíció lekérése
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const positions = await prisma.position.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                order: 'asc'
            },
            select: {
                id: true,
                name: true,
                displayName: true,
                description: true,
                color: true,
                order: true,
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });

        return NextResponse.json(positions);
    } catch (error) {
        console.error('GET /api/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}