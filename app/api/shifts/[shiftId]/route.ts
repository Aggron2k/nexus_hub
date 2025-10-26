// app/api/shifts/[shiftId]/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

interface RouteParams {
    params: {
        shiftId: string;
    };
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const currentUser = await getCurrentUser();

        // Csak Manager+ módosíthat műszakot
        if (!currentUser || !['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role)) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { shiftId } = params;
        const body = await request.json();
        const {
            weekScheduleId,
            userId,
            positionId,
            date,
            startTime,
            endTime,
            hoursWorked,
            notes
        } = body;

        // Validáció
        if (!weekScheduleId || !userId || !positionId || !date || !startTime || !endTime) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Ellenőrizzük, hogy létezik-e a műszak
        const existingShift = await prisma.shift.findUnique({
            where: { id: shiftId }
        });

        if (!existingShift) {
            return new NextResponse("Shift not found", { status: 404 });
        }

        // Frissítjük a műszakot
        const updatedShift = await prisma.shift.update({
            where: { id: shiftId },
            data: {
                weekScheduleId,
                userId,
                positionId,
                date: new Date(date),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                hoursWorked: hoursWorked || null,
                notes: notes || null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                position: {
                    select: {
                        id: true,
                        name: true,
                        displayNames: true,
                        color: true
                    }
                }
            }
        });

        return NextResponse.json(updatedShift);
    } catch (error) {
        console.error('PUT /api/shifts/[shiftId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const currentUser = await getCurrentUser();

        // Csak Manager+ törölhet műszakot
        if (!currentUser || !['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role)) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { shiftId } = params;

        // Ellenőrizzük, hogy létezik-e a műszak
        const existingShift = await prisma.shift.findUnique({
            where: { id: shiftId }
        });

        if (!existingShift) {
            return new NextResponse("Shift not found", { status: 404 });
        }

        // Töröljük a műszakot
        await prisma.shift.delete({
            where: { id: shiftId }
        });

        return NextResponse.json({ message: "Shift deleted successfully" });
    } catch (error) {
        console.error('DELETE /api/shifts/[shiftId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
