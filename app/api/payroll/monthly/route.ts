// app/api/payroll/monthly/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        // Hónap kezdete és vége
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        // Lekérjük az összes shift-et és ledolgozott órákat a hónapra
        const actualWorkHours = await prisma.actualWorkHours.findMany({
            where: {
                userId: currentUser.id,
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

        const hourlyRate = currentUser.hourlyRate || 0;

        // Csoportosítás hetekre
        const weeklyData: any[] = [];
        let currentWeek: any = null;
        let currentWeekStartTime: number | null = null;
        let weekNumber = 1;

        actualWorkHours.forEach((record) => {
            const shiftDate = new Date(record.shift.date);
            const dayOfWeek = shiftDate.getDay(); // 0 = vasárnap, 1 = hétfő, ...

            // Hét kezdete (hétfő)
            const weekStart = new Date(shiftDate);
            weekStart.setDate(shiftDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            weekStart.setHours(0, 0, 0, 0);
            const weekStartTime = weekStart.getTime();

            // Ha új hét kezdődik
            if (!currentWeek || currentWeekStartTime !== weekStartTime) {
                if (currentWeek) {
                    weeklyData.push(currentWeek);
                }

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                currentWeek = {
                    weekNumber,
                    weekStart: weekStart.toISOString(),
                    weekEnd: weekEnd.toISOString(),
                    days: Array(7).fill(null).map((_, i) => {
                        const date = new Date(weekStart);
                        date.setDate(weekStart.getDate() + i);
                        return {
                            date: date.toISOString(),
                            dayOfWeek: i + 1, // 1 = hétfő, 7 = vasárnap
                            hours: 0,
                            grossAmount: 0,
                        };
                    }),
                    totalHours: 0,
                    totalGrossAmount: 0,
                };
                currentWeekStartTime = weekStartTime;
                weekNumber++;
            }

            // Hozzáadjuk az órát a megfelelő naphoz
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = hétfő, 6 = vasárnap
            const hours = record.actualHoursWorked || 0;
            const amount = hours * hourlyRate;

            currentWeek.days[dayIndex].hours += hours;
            currentWeek.days[dayIndex].grossAmount += amount;
            currentWeek.totalHours += hours;
            currentWeek.totalGrossAmount += amount;
        });

        // Utolsó hét hozzáadása
        if (currentWeek) {
            weeklyData.push(currentWeek);
        }

        // Havi összesítő
        const monthlyTotal = weeklyData.reduce(
            (sum, week) => ({
                hours: sum.hours + week.totalHours,
                grossAmount: sum.grossAmount + week.totalGrossAmount,
            }),
            { hours: 0, grossAmount: 0 }
        );

        return NextResponse.json({
            year,
            month,
            hourlyRate,
            weeklyData,
            monthlyTotal: {
                hours: Math.round(monthlyTotal.hours * 10) / 10,
                grossAmount: Math.round(monthlyTotal.grossAmount),
            },
        });
    } catch (error) {
        console.error("PAYROLL_MONTHLY_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
