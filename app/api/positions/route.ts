import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

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
                displayNames: true,        // ← VÁLTOZÁS: displayName → displayNames
                descriptions: true,        // ← VÁLTOZÁS: description → descriptions
                color: true,
                order: true,
                isActive: true,           // ← HOZZÁADÁS
                _count: {
                    select: {
                        userPositions: true
                    }
                }
            }
        });

        // Backward compatibility - users count hozzáadása
        const processedPositions = positions.map(position => ({
            ...position,
            _count: {
                ...position._count,
                users: position._count.userPositions
            }
        }));

        return NextResponse.json(processedPositions);
    } catch (error) {
        console.error('GET /api/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}