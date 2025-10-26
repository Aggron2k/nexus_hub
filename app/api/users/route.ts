// app/api/users/route.ts
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

        // Lekérjük az összes felhasználót (ugyanúgy mint getAllUsers)
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                deletedAt: true, // Szükséges a szűréshez
                userPositions: {
                    select: {
                        isPrimary: true,
                        assignedAt: true,
                        position: {
                            select: {
                                id: true,
                                name: true,
                                displayNames: true,
                                descriptions: true,
                                color: true,
                                isActive: true,
                                order: true
                            }
                        }
                    },
                    orderBy: [
                        { isPrimary: 'desc' },
                        { assignedAt: 'desc' }
                    ]
                },
                createdAt: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Kiszűrjük a törölt felhasználókat (ugyanúgy mint getAllUsers)
        const users = allUsers.filter(user => !user.deletedAt);

        // Feldolgozzuk a választ - backward compatibility
        const processedUsers = users.map(user => {
            const primaryPosition = user.userPositions.find(up => up.isPrimary);
            const firstPosition = user.userPositions[0];

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                // Backward compatibility
                position: (primaryPosition || firstPosition)?.position || null,
                positionId: (primaryPosition || firstPosition)?.position.id || null
            };
        });

        return NextResponse.json(processedUsers);
    } catch (error) {
        console.error('GET /api/users error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}