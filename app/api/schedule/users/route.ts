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

        // Lekérjük az összes felhasználót a pozíciókkal együtt
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                deletedAt: true,
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
                                color: true,
                                isActive: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Szűrjük ki a törölt usereket JavaScript-ben (ha a mező nincs definiálva, undefined lesz)
        const activeUsers = allUsers.filter(user => !user.deletedAt);

        console.log('Total users:', allUsers.length);
        console.log('Active users:', activeUsers.length);
        console.log('Users with positions:', activeUsers.filter(u => u.userPositions.length > 0).length);

        return NextResponse.json(activeUsers);
    } catch (error) {
        console.error('GET /api/schedule/users error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
