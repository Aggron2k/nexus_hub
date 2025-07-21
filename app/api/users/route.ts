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

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
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

        // Feldolgozzuk a választ backward compatibility érdekében
        const processedUsers = users.map(user => {
            const { userPositions, ...userData } = user;
            const primaryPosition = userPositions.find(up => up.isPrimary);
            const firstPosition = userPositions.length > 0 ? userPositions[0] : null;
            
            return {
                ...userData,
                // Új formátum - több pozíció
                positions: userPositions.map(up => ({
                    id: up.position.id,
                    name: up.position.name,
                    displayNames: up.position.displayNames,
                    descriptions: up.position.descriptions,
                    color: up.position.color,
                    isActive: up.position.isActive,
                    order: up.position.order,
                    isPrimary: up.isPrimary,
                    assignedAt: up.assignedAt
                })),
                // Backward compatibility - elsődleges vagy első pozíció
                position: primaryPosition?.position || firstPosition?.position || null,
                positionId: primaryPosition?.position.id || firstPosition?.position.id || null
            };
        });

        return NextResponse.json(processedUsers);
    } catch (error) {
        console.error('GET /api/users error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}