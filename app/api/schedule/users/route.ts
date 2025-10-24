// app/api/schedule/users/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Lekérjük az összes aktív felhasználót a pozíciókkal együtt
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                userPositions: {
                    where: {
                        position: {
                            isActive: true
                        }
                    },
                    include: {
                        position: {
                            select: {
                                id: true,
                                name: true,
                                displayNames: true,
                                color: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('GET /api/schedule/users error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
