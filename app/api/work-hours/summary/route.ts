import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const weekScheduleId = searchParams.get('weekScheduleId');
        const userId = searchParams.get('userId');

        // Validáció
        if (!weekScheduleId) {
            return new NextResponse("weekScheduleId required", { status: 400 });
        }

        // Ha nincs userId megadva, a bejelentkezett user adatait adjuk vissza
        const targetUserId = userId || currentUser.id;

        // Employee csak a saját adatait kérheti le
        if (currentUser.role === 'Employee' && targetUserId !== currentUser.id) {
            return new NextResponse("Forbidden - Employees can only view their own data", { status: 403 });
        }

        // User adatok lekérése (weeklyRequiredHours)
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                name: true,
                weeklyRequiredHours: true,
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // ShiftRequests lekérése (requested hours)
        const shiftRequests = await prisma.shiftRequest.findMany({
            where: {
                weekScheduleId: weekScheduleId,
                userId: targetUserId,
            },
            select: {
                id: true,
                type: true,
                date: true,
                preferredStartTime: true,
                preferredEndTime: true,
                status: true,
            }
        });

        // Shifts lekérése (planned hours)
        const shifts = await prisma.shift.findMany({
            where: {
                weekScheduleId: weekScheduleId,
                userId: targetUserId,
            },
            select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                hoursWorked: true,
                actualWorkHours: {
                    select: {
                        id: true,
                        status: true,
                        actualStartTime: true,
                        actualEndTime: true,
                        actualHoursWorked: true,
                    }
                }
            }
        });

        // Requested hours számítása
        let requestedHours = 0;
        let requestCount = 0;

        shiftRequests.forEach(request => {
            // Csak SPECIFIC_TIME típusú requesteket számoljuk (AVAILABLE és TIME_OFF nem tartalmaz órát)
            if (request.type === 'SPECIFIC_TIME' && request.preferredStartTime && request.preferredEndTime) {
                const start = new Date(request.preferredStartTime);
                const end = new Date(request.preferredEndTime);
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                requestedHours += hours;
                requestCount++;
            }
        });

        // Planned hours számítása
        let plannedHours = 0;
        const plannedCount = shifts.length;

        shifts.forEach(shift => {
            if (shift.hoursWorked) {
                plannedHours += shift.hoursWorked;
            }
        });

        // Actual hours számítása
        let actualHours = 0;
        let actualCount = 0;
        let presentCount = 0;
        let sickCount = 0;
        let absentCount = 0;

        shifts.forEach(shift => {
            if (shift.actualWorkHours) {
                actualCount++;

                if (shift.actualWorkHours.status === 'PRESENT') {
                    presentCount++;
                    if (shift.actualWorkHours.actualHoursWorked) {
                        actualHours += shift.actualWorkHours.actualHoursWorked;
                    }
                } else if (shift.actualWorkHours.status === 'SICK') {
                    sickCount++;
                } else if (shift.actualWorkHours.status === 'ABSENT') {
                    absentCount++;
                }
            }
        });

        // Warnings generálása
        const warnings: string[] = [];
        const weeklyRequirement = user.weeklyRequiredHours || 40; // Default 40 if not set

        if (requestedHours < weeklyRequirement) {
            const diff = weeklyRequirement - requestedHours;
            warnings.push(`You requested ${diff.toFixed(1)} hours less than your weekly requirement`);
        }

        if (plannedHours < weeklyRequirement) {
            const diff = weeklyRequirement - plannedHours;
            warnings.push(`You are scheduled ${diff.toFixed(1)} hours less than your weekly requirement`);
        }

        // Response összeállítása
        const summary = {
            userId: targetUserId,
            userName: user.name,
            weekScheduleId: weekScheduleId,
            weeklyRequirement: weeklyRequirement,
            requested: {
                hours: Math.round(requestedHours * 10) / 10, // 1 tizedes
                count: requestCount
            },
            planned: {
                hours: Math.round(plannedHours * 10) / 10,
                count: plannedCount
            },
            actual: {
                hours: Math.round(actualHours * 10) / 10,
                count: actualCount,
                present: presentCount,
                sick: sickCount,
                absent: absentCount
            },
            warnings: warnings
        };

        return NextResponse.json(summary);

    } catch (error) {
        console.error('GET /api/work-hours/summary error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
