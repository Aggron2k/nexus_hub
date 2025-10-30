// app/api/shifts/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

// Helper funkció: Ellenőrzi hogy van-e overlap két időintervallum között
function hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    // Két időintervallum átfedi egymást, ha:
    // start1 < end2 ÉS start2 < end1
    return start1 < end2 && start2 < end1;
}

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        // Csak Manager+ hozhat létre műszakot
        if (!currentUser || !['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role)) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

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

        // Ellenőrizzük hogy van-e már létező műszak ugyanezzel a felhasználóval ugyanezen időben
        const existingShifts = await prisma.shift.findMany({
            where: {
                userId: userId,
                date: new Date(date)
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
        for (const existingShift of existingShifts) {
            if (hasTimeOverlap(newStartTime, newEndTime, existingShift.startTime, existingShift.endTime)) {
                const existingStart = existingShift.startTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
                const existingEnd = existingShift.endTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
                return new NextResponse(
                    `A felhasználónak már van műszakja ezen az időpontban: ${existingStart} - ${existingEnd}`,
                    { status: 409 }
                );
            }
        }

        // Létrehozzuk a műszakot
        const shift = await prisma.shift.create({
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

        return NextResponse.json(shift);
    } catch (error) {
        console.error('POST /api/shifts error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const scheduleId = searchParams.get('scheduleId');

        if (!scheduleId) {
            return new NextResponse("Schedule ID required", { status: 400 });
        }

        // Lekérjük a műszakokat
        const shifts = await prisma.shift.findMany({
            where: {
                weekScheduleId: scheduleId
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
                },
                actualWorkHours: true // Include actual work hours
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        return NextResponse.json(shifts);
    } catch (error) {
        console.error('GET /api/shifts error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
