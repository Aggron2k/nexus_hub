// app/api/users/[userId]/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import bcrypt from "bcrypt";

interface RouteParams {
    params: {
        userId: string;
    };
}

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
        const { currentPassword, newPassword } = body;

        // Validáció
        if (!currentPassword || !newPassword) {
            return new NextResponse("Current password and new password are required", { status: 400 });
        }

        if (newPassword.length < 6) {
            return new NextResponse("New password must be at least 6 characters long", { status: 400 });
        }

        // Csak saját jelszót lehet módosítani (kivéve CEO és GeneralManager)
        const canChangePassword = currentUser.id === userId ||
            ['CEO', 'GeneralManager'].includes(currentUser.role);

        if (!canChangePassword) {
            return new NextResponse("Forbidden - Only own password can be changed", { status: 403 });
        }

        // Felhasználó megkeresése
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !user.hashedPassword) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Ha nem a saját jelszót módosítja (CEO/GeneralManager esetén), akkor nem kell a jelenlegi jelszó
        if (currentUser.id === userId) {
            // Jelenlegi jelszó ellenőrzése
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
            if (!isCurrentPasswordValid) {
                return new NextResponse("Invalid current password", { status: 400 });
            }
        }

        // Új jelszó hash-elése
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Jelszó frissítése
        await prisma.user.update({
            where: { id: userId },
            data: {
                hashedPassword: hashedNewPassword,
                updatedAt: new Date()
            }
        });

        return new NextResponse("Password changed successfully", { status: 200 });

    } catch (error) {
        console.error('POST /api/users/[userId]/change-password error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}