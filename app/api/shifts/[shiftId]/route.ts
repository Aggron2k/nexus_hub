// app/api/shifts/[shiftId]/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

interface RouteParams {
    params: {
        shiftId: string;
    };
}

// Helper funkció: Ellenőrzi hogy van-e overlap két időintervallum között
function hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    // Két időintervallum átfedi egymást, ha:
    // start1 < end2 ÉS start2 < end1
    return start1 < end2 && start2 < end1;
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const currentUser = await getCurrentUser();

        // Csak GeneralManager és CEO módosíthat műszakot
        if (!currentUser || !['GeneralManager', 'CEO'].includes(currentUser.role)) {
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

        // Validáció - weekScheduleId, userId, és date kötelező
        if (!weekScheduleId || !userId || !date) {
            return new NextResponse("Missing required fields (weekScheduleId, userId, date)", { status: 400 });
        }

        // positionId, startTime, endTime most opcionális (nullable placeholder shiftek miatt)
        // Ha startTime és endTime meg van adva, akkor validáljuk
        if (startTime && endTime) {
            // Időpont validáció
            const newStartTime = new Date(startTime);
            const newEndTime = new Date(endTime);

            if (newStartTime >= newEndTime) {
                return new NextResponse("startTime must be before endTime", { status: 400 });
            }
        }

        // Ellenőrizzük, hogy létezik-e a műszak
        const existingShift = await prisma.shift.findUnique({
            where: { id: shiftId }
        });

        if (!existingShift) {
            return new NextResponse("Shift not found", { status: 404 });
        }

        // Overlap ellenőrzés - CSAK ha startTime és endTime meg van adva
        if (startTime && endTime) {
            const otherShifts = await prisma.shift.findMany({
                where: {
                    userId: userId,
                    date: new Date(date),
                    id: { not: shiftId }, // Kizárjuk az aktuális műszakot
                    startTime: { not: null }, // Csak kitöltött műszakokat ellenőrizzük
                    endTime: { not: null }
                },
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    position: {
                        select: {
                            name: true,
                            displayNames: true
                        }
                    }
                }
            });

            const newStartTime = new Date(startTime);
            const newEndTime = new Date(endTime);

            // Ellenőrizzük hogy van-e overlap
            for (const otherShift of otherShifts) {
                if (otherShift.startTime && otherShift.endTime) {
                    if (hasTimeOverlap(newStartTime, newEndTime, otherShift.startTime, otherShift.endTime)) {
                        const existingStart = otherShift.startTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
                        const existingEnd = otherShift.endTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
                        return new NextResponse(
                            `A felhasználónak már van műszakja ezen az időpontban: ${existingStart} - ${existingEnd}`,
                            { status: 409 }
                        );
                    }
                }
            }
        }

        // Frissítjük a műszakot
        const updatedShift = await prisma.shift.update({
            where: { id: shiftId },
            data: {
                weekScheduleId,
                userId,
                positionId: positionId || null, // Nullable
                date: new Date(date),
                startTime: startTime ? new Date(startTime) : null, // Nullable
                endTime: endTime ? new Date(endTime) : null, // Nullable
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

// PATCH - Actual hours recording
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const currentUser = await getCurrentUser();

        // Csak GeneralManager és CEO rögzíthet tényleges munkaórákat
        if (!currentUser || !['GeneralManager', 'CEO'].includes(currentUser.role)) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { shiftId } = params;
        const body = await request.json();
        const { actualStartTime, actualEndTime, actualStatus } = body;

        // Ellenőrizzük, hogy létezik-e a műszak
        const existingShift = await prisma.shift.findUnique({
            where: { id: shiftId },
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

        if (!existingShift) {
            return new NextResponse("Shift not found", { status: 404 });
        }

        // Validációk
        // 0. A műszaknak már ki kell legyen töltve (nem lehet placeholder)
        if (!existingShift.startTime || !existingShift.endTime) {
            return new NextResponse(
                "Tényleges munkaórák csak kitöltött műszakokhoz rögzíthetők (placeholder műszakhoz nem)",
                { status: 400 }
            );
        }

        // 1. Nem lehet actual hours-t rögzíteni a műszak vége előtt
        const now = new Date();
        if (now < existingShift.endTime) {
            return new NextResponse(
                "Tényleges munkaórák csak a műszak befejezése után rögzíthetők",
                { status: 400 }
            );
        }

        // 2. actualStatus kötelező
        if (!actualStatus || !['PRESENT', 'SICK', 'ABSENT'].includes(actualStatus)) {
            return new NextResponse(
                "Érvényes actualStatus szükséges (PRESENT, SICK, ABSENT)",
                { status: 400 }
            );
        }

        // 3. Ha PRESENT, akkor actualStartTime és actualEndTime kötelező
        if (actualStatus === 'PRESENT') {
            if (!actualStartTime || !actualEndTime) {
                return new NextResponse(
                    "PRESENT státusz esetén actualStartTime és actualEndTime kötelező",
                    { status: 400 }
                );
            }

            const actualStart = new Date(actualStartTime);
            const actualEnd = new Date(actualEndTime);

            // 4. actualStartTime < actualEndTime
            if (actualStart >= actualEnd) {
                return new NextResponse(
                    "actualStartTime korábbinakMust be earlier than actualEndTime",
                    { status: 400 }
                );
            }

            // 5. Számoljuk ki az actualHoursWorked-t
            const actualHoursWorked = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60);

            // Ellenőrizzük van-e már ActualWorkHours rekord
            const existingActualHours = await prisma.actualWorkHours.findUnique({
                where: { shiftId: shiftId }
            });

            if (existingActualHours) {
                // Frissítjük a meglévő rekordot
                await prisma.actualWorkHours.update({
                    where: { shiftId: shiftId },
                    data: {
                        actualStartTime: actualStart,
                        actualEndTime: actualEnd,
                        status: actualStatus,
                        actualHoursWorked: actualHoursWorked,
                        recordedById: currentUser.id,
                        recordedAt: new Date()
                    }
                });
            } else {
                // Új rekord létrehozása
                await prisma.actualWorkHours.create({
                    data: {
                        shiftId: shiftId,
                        userId: existingShift.userId,
                        actualStartTime: actualStart,
                        actualEndTime: actualEnd,
                        status: actualStatus,
                        actualHoursWorked: actualHoursWorked,
                        recordedById: currentUser.id,
                        recordedAt: new Date()
                    }
                });
            }

            // Visszaadjuk a frissített shift-et az actualWorkHours-szal együtt
            const updatedShift = await prisma.shift.findUnique({
                where: { id: shiftId },
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
                    },
                    actualWorkHours: true
                }
            });

            return NextResponse.json(updatedShift);
        } else {
            // SICK vagy ABSENT - nincs szükség időpontokra
            // Ellenőrizzük van-e már ActualWorkHours rekord
            const existingActualHours = await prisma.actualWorkHours.findUnique({
                where: { shiftId: shiftId }
            });

            if (existingActualHours) {
                // Frissítjük a meglévő rekordot
                await prisma.actualWorkHours.update({
                    where: { shiftId: shiftId },
                    data: {
                        actualStartTime: null,
                        actualEndTime: null,
                        status: actualStatus,
                        actualHoursWorked: null,
                        recordedById: currentUser.id,
                        recordedAt: new Date()
                    }
                });
            } else {
                // Új rekord létrehozása
                await prisma.actualWorkHours.create({
                    data: {
                        shiftId: shiftId,
                        userId: existingShift.userId,
                        actualStartTime: null,
                        actualEndTime: null,
                        status: actualStatus,
                        actualHoursWorked: null,
                        recordedById: currentUser.id,
                        recordedAt: new Date()
                    }
                });
            }

            // Visszaadjuk a frissített shift-et az actualWorkHours-szal együtt
            const updatedShift = await prisma.shift.findUnique({
                where: { id: shiftId },
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
                    },
                    actualWorkHours: true
                }
            });

            return NextResponse.json(updatedShift);
        }
    } catch (error) {
        console.error('PATCH /api/shifts/[shiftId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const currentUser = await getCurrentUser();

        // Csak GeneralManager és CEO törölhet műszakot
        if (!currentUser || !['GeneralManager', 'CEO'].includes(currentUser.role)) {
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
