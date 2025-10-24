// app/api/schedule/[scheduleId]/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET(
    request: Request,
    { params }: { params: { scheduleId: string } }
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { scheduleId } = params;

        if (!scheduleId) {
            return new NextResponse("Schedule ID required", { status: 400 });
        }

        // Lekérjük a beosztást
        const schedule = await prisma.weekSchedule.findUnique({
            where: {
                id: scheduleId
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
                }
            }
        });

        if (!schedule) {
            return new NextResponse("Schedule not found", { status: 404 });
        }

        return NextResponse.json(schedule);
    } catch (error) {
        console.error('GET /api/schedule/[scheduleId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { scheduleId: string } }
) {
    try {
        const currentUser = await getCurrentUser();

        // Csak Manager+ szerkeszthet beosztást
        if (!currentUser || !['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role)) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { scheduleId } = params;
        const body = await request.json();

        if (!scheduleId) {
            return new NextResponse("Schedule ID required", { status: 400 });
        }

        // Frissítjük a beosztást
        const updatedSchedule = await prisma.weekSchedule.update({
            where: {
                id: scheduleId
            },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(updatedSchedule);
    } catch (error) {
        console.error('PATCH /api/schedule/[scheduleId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { scheduleId: string } }
) {
    try {
        const currentUser = await getCurrentUser();

        // Csak CEO törölhet beosztást
        if (!currentUser || currentUser.role !== 'CEO') {
            return new NextResponse("Unauthorized - Only CEO can delete schedules", { status: 403 });
        }

        const { scheduleId } = params;

        if (!scheduleId) {
            return new NextResponse("Schedule ID required", { status: 400 });
        }

        // Töröljük a beosztást (cascade törli a shifteket is)
        await prisma.weekSchedule.delete({
            where: {
                id: scheduleId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/schedule/[scheduleId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
