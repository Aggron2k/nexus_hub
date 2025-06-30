// app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { Role } from "@prisma/client";

interface RouteParams {
    params: {
        userId: string;
    };
}

// GET - Felhasználó adatok lekérése
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

        // Ellenőrizzük a jogosultságokat
        const canViewOthers = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

        if (!canViewOthers && userId !== currentUser.id) {
            return new NextResponse("Forbidden - Csak a saját profil megtekintése engedélyezett", { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                position: true
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Érzékeny adatok eltávolítása
        const { hashedPassword, ...safeUser } = user;

        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('GET /api/users/[userId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PUT - Felhasználó adatok módosítása
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = params;

        // Jogosultság ellenőrzése
        const canEditOthers = ['GeneralManager', 'CEO'].includes(currentUser.role);
        const isSelfEdit = userId === currentUser.id;

        if (!canEditOthers && !isSelfEdit) {
            return new NextResponse("Forbidden - Nincs jogosultság a módosításhoz", { status: 403 });
        }

        const body = await request.json();
        const { name, email, role, positionId, image } = body;

        // Alapvető validációk
        if (!name || !email) {
            return new NextResponse("Name and email are required", { status: 400 });
        }

        // Email egyediség ellenőrzése
        const existingUser = await prisma.user.findFirst({
            where: {
                email: email,
                NOT: {
                    id: userId
                }
            }
        });

        if (existingUser) {
            return new NextResponse("Email already exists", { status: 400 });
        }

        // Pozíció létezésének ellenőrzése (ha meg van adva)
        if (positionId) {
            const position = await prisma.position.findUnique({
                where: { id: positionId }
            });

            if (!position) {
                return new NextResponse("Position not found", { status: 400 });
            }
        }

        // Update data objektum összeállítása
        const updateData: any = {
            name,
            email,
            image
        };

        // Pozíció hozzáadása (ha van)
        if (positionId) {
            updateData.positionId = positionId;
        }

        // Szerepkör módosítás jogosultsági ellenőrzése
        if (role && !isSelfEdit && canEditOthers) {
            // Csak CEO adhat CEO szerepkört
            if (role === Role.CEO && currentUser.role !== Role.CEO) {
                return new NextResponse("Forbidden - Csak CEO adhat CEO szerepkört", { status: 403 });
            }

            // GM nem adhat GM vagy CEO szerepkört
            if (currentUser.role === Role.GeneralManager &&
                (role === Role.GeneralManager || role === Role.CEO)) {
                return new NextResponse("Forbidden - Nincs jogosultság ehhez a szerepkörhöz", { status: 403 });
            }

            updateData.role = role;
        }

        // Felhasználó frissítése
        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: updateData,
            include: {
                position: true
            }
        });

        // Érzékeny adatok eltávolítása a válaszból
        const { hashedPassword, ...safeUser } = updatedUser;

        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('PUT /api/users/[userId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE - Felhasználó törlése (csak CEO)
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Csak CEO törölhet felhasználót
        if (currentUser.role !== Role.CEO) {
            return new NextResponse("Forbidden - Csak CEO törölhet felhasználót", { status: 403 });
        }

        const { userId } = params;

        // Saját magát nem törölheti
        if (userId === currentUser.id) {
            return new NextResponse("Forbidden - Saját magad nem törölheted", { status: 403 });
        }

        // Ellenőrizzük, hogy létezik-e a felhasználó
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userToDelete) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Felhasználó törlése (CASCADE gondoskodik a kapcsolódó adatok törléséről)
        await prisma.user.delete({
            where: {
                id: userId
            }
        });

        return new NextResponse("User deleted successfully", { status: 200 });
    } catch (error) {
        console.error('DELETE /api/users/[userId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}