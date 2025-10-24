// app/api/schedule/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        // Csak Manager+ hozhat létre beosztást
        if (!currentUser || !['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role)) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await request.json();
        const { weekStart, weekEnd } = body;

        if (!weekStart || !weekEnd) {
            return new NextResponse("Week start and end are required", { status: 400 });
        }

        // Ellenőrizzük, hogy a weekStart hétfő-e
        const weekStartDate = new Date(weekStart);
        if (weekStartDate.getDay() !== 1) {
            return new NextResponse("Week must start on Monday", { status: 400 });
        }

        // Ellenőrizzük, hogy nincs-e már létező beosztás erre a hétre
        const existingSchedule = await prisma.weekSchedule.findFirst({
            where: {
                weekStart: new Date(weekStart)
            }
        });

        if (existingSchedule) {
            return new NextResponse("Schedule already exists for this week", { status: 409 });
        }

        // Létrehozzuk az új beosztást
        const newSchedule = await prisma.weekSchedule.create({
            data: {
                weekStart: new Date(weekStart),
                weekEnd: new Date(weekEnd),
                createdById: currentUser.id,
                isPublished: false
            }
        });

        return NextResponse.json(newSchedule);
    } catch (error) {
        console.error('POST /api/schedule error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Lekérjük az összes beosztást
        const schedules = await prisma.weekSchedule.findMany({
            orderBy: {
                weekStart: 'desc'
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                shifts: {
                    select: {
                        id: true,
                        userId: true,
                        date: true
                    }
                }
            }
        });

        return NextResponse.json(schedules);
    } catch (error) {
        console.error('GET /api/schedule error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
