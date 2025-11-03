// app/api/users/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/libs/auth";
import prisma from "@/app/libs/prismadb";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Lekérjük a user-t a userPositions-szel együtt
        const currentUser = await prisma.user.findUnique({
            where: {
                email: session.user.email as string
            },
            include: {
                userPositions: {
                    include: {
                        position: true
                    },
                    orderBy: [
                        { isPrimary: 'desc' },
                        { assignedAt: 'desc' }
                    ]
                }
            }
        });

        if (!currentUser || currentUser.deletedAt) {
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
