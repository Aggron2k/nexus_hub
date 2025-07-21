// app/api/users/[userId]/positions/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

interface RouteParams {
    params: {
        userId: string;
    };
}

// GET - Felhasználó pozícióinak lekérése
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = params;

        // Jogosultságok ellenőrzése
        const canViewOthers = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

        if (!canViewOthers && userId !== currentUser.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const userPositions = await prisma.userPosition.findMany({
            where: {
                userId: userId
            },
            include: {
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
        });

        const positions = userPositions.map(up => ({
            id: up.position.id,
            name: up.position.name,
            displayNames: up.position.displayNames,
            descriptions: up.position.descriptions,
            color: up.position.color,
            isActive: up.position.isActive,
            order: up.position.order,
            isPrimary: up.isPrimary,
            assignedAt: up.assignedAt
        }));

        return NextResponse.json(positions);

    } catch (error) {
        console.error('GET /api/users/[userId]/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST - Pozíció hozzáadása a felhasználóhoz
export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = params;
        const body = await request.json();
        const { positionId, isPrimary = false } = body;

        // Jogosultságok ellenőrzése - csak Manager és feljebb
        const canEdit = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

        if (!canEdit) {
            return new NextResponse("Forbidden - Nincs jogosultság a pozíció hozzáadásához", { status: 403 });
        }

        if (!positionId) {
            return new NextResponse("Position ID is required", { status: 400 });
        }

        // Ellenőrizzük, hogy létezik-e a pozíció
        const position = await prisma.position.findUnique({
            where: { id: positionId }
        });

        if (!position) {
            return new NextResponse("Position not found", { status: 404 });
        }

        // Ellenőrizzük, hogy már hozzá van-e rendelve
        const existingAssignment = await prisma.userPosition.findUnique({
            where: {
                userId_positionId: {
                    userId: userId,
                    positionId: positionId
                }
            }
        });

        if (existingAssignment) {
            return new NextResponse("Position already assigned to user", { status: 409 });
        }

        // Ha ez lesz az elsődleges pozíció, töröljük a korábbi elsődleges jelölést
        if (isPrimary) {
            await prisma.userPosition.updateMany({
                where: {
                    userId: userId,
                    isPrimary: true
                },
                data: {
                    isPrimary: false
                }
            });
        }

        // Pozíció hozzáadása
        const userPosition = await prisma.userPosition.create({
            data: {
                userId: userId,
                positionId: positionId,
                isPrimary: isPrimary,
                assignedBy: currentUser.id
            },
            include: {
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
            }
        });

        const result = {
            id: userPosition.position.id,
            name: userPosition.position.name,
            displayNames: userPosition.position.displayNames,
            descriptions: userPosition.position.descriptions,
            color: userPosition.position.color,
            isActive: userPosition.position.isActive,
            order: userPosition.position.order,
            isPrimary: userPosition.isPrimary,
            assignedAt: userPosition.assignedAt
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error('POST /api/users/[userId]/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE - Pozíció eltávolítása a felhasználótól
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = params;
        const { searchParams } = new URL(request.url);
        const positionId = searchParams.get('positionId');

        // Jogosultságok ellenőrzése
        const canEdit = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

        if (!canEdit) {
            return new NextResponse("Forbidden - Nincs jogosultság a pozíció eltávolításához", { status: 403 });
        }

        if (!positionId) {
            return new NextResponse("Position ID is required", { status: 400 });
        }

        // Pozíció eltávolítása
        await prisma.userPosition.delete({
            where: {
                userId_positionId: {
                    userId: userId,
                    positionId: positionId
                }
            }
        });

        return new NextResponse("Position removed successfully", { status: 200 });

    } catch (error) {
        console.error('DELETE /api/users/[userId]/positions error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}