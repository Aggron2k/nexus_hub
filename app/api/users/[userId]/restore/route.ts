// app/api/users/[userId]/restore/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { EmploymentStatus } from "@prisma/client";

export async function POST(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const currentUser = await getCurrentUser();

        // Csak CEO hozhatja vissza a törölt felhasználókat
        if (!currentUser || currentUser.role !== 'CEO') {
            return new NextResponse("Unauthorized - Only CEO can restore users", { status: 403 });
        }

        const { userId } = params;

        if (!userId) {
            return new NextResponse("User ID required", { status: 400 });
        }

        // Ellenőrizzük, hogy létezik-e a felhasználó és törölve van-e
        const existingUser = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!existingUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        if (!existingUser.deletedAt) {
            return new NextResponse("User is not deleted", { status: 400 });
        }

        // Helyreállítjuk a felhasználót
        const restoredUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                deletedAt: null,
                deletedBy: null,
                employmentStatus: EmploymentStatus.ACTIVE  // Automatikusan ACTIVE státuszra állítjuk
            }
        });

        return NextResponse.json(restoredUser);
    } catch (error) {
        console.error('POST /api/users/[userId]/restore error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
