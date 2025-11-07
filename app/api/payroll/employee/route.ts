// app/api/payroll/employee/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Csak GM és CEO férhet hozzá
        if (currentUser.role !== "GeneralManager" && currentUser.role !== "CEO") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        if (!userId) {
            return new NextResponse("User ID required", { status: 400 });
        }

        // Hónap kezdete és vége
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        // Dolgozó adatai
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userPositions: {
                    where: {
                        isPrimary: true,
                    },
                    include: {
                        position: true,
                    },
                },
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Ledolgozott órák részletesen
        const actualWorkHours = await prisma.actualWorkHours.findMany({
            where: {
                userId,
                shift: {
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
            },
            include: {
                shift: {
                    include: {
                        position: true,
                    },
                },
            },
            orderBy: {
                shift: {
                    date: 'asc',
                },
            },
        });

        const hourlyRate = user.hourlyRate || 0;

        // Heti bontás
        const weeklyBreakdown: any[] = [];
        let currentWeek: any = null;
        let currentWeekStartTime: number | null = null;
        let weekNumber = 1;

        actualWorkHours.forEach((record) => {
            const shiftDate = new Date(record.shift.date);
            const dayOfWeek = shiftDate.getDay();

            const weekStart = new Date(shiftDate);
            weekStart.setDate(shiftDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            weekStart.setHours(0, 0, 0, 0);
            const weekStartTime = weekStart.getTime();

            if (!currentWeek || currentWeekStartTime !== weekStartTime) {
                if (currentWeek) {
                    weeklyBreakdown.push(currentWeek);
                }

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                currentWeek = {
                    weekNumber,
                    weekStart: weekStart.toISOString(),
                    weekEnd: weekEnd.toISOString(),
                    totalHours: 0,
                    totalGrossAmount: 0,
                };
                currentWeekStartTime = weekStartTime;
                weekNumber++;
            }

            const hours = record.actualHoursWorked || 0;
            const amount = hours * hourlyRate;

            currentWeek.totalHours += hours;
            currentWeek.totalGrossAmount += amount;
        });

        if (currentWeek) {
            weeklyBreakdown.push(currentWeek);
        }

        // Havi összesítő
        const totalHours = actualWorkHours.reduce(
            (sum, record) => sum + (record.actualHoursWorked || 0),
            0
        );
        const grossAmount = totalHours * hourlyRate;

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                position: user.userPositions[0]?.position?.displayNames || null,
            },
            year,
            month,
            hourlyRate,
            totalHours: Math.round(totalHours * 10) / 10,
            grossAmount: Math.round(grossAmount),
            weeklyBreakdown: weeklyBreakdown.map(week => ({
                ...week,
                totalHours: Math.round(week.totalHours * 10) / 10,
                totalGrossAmount: Math.round(week.totalGrossAmount),
            })),
        });
    } catch (error) {
        console.error("PAYROLL_EMPLOYEE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
