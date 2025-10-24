// app/api/shifts/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

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
                }
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
