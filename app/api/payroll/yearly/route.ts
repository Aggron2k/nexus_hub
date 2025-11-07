// app/api/payroll/yearly/route.ts
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

        const hourlyRate = currentUser.hourlyRate || 0;

        // Lekérjük az összes hónap adatait
        const monthlyData = await Promise.all(
            Array.from({ length: 12 }, async (_, index) => {
                const month = index + 1;
                const monthStart = new Date(year, month - 1, 1);
                const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

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
                });

                const totalHours = actualWorkHours.reduce(
                    (sum, record) => sum + (record.actualHoursWorked || 0),
                    0
                );

                const grossAmount = totalHours * hourlyRate;

                return {
                    month,
                    monthName: monthStart.toLocaleString('default', { month: 'long' }),
                    hours: Math.round(totalHours * 10) / 10,
                    grossAmount: Math.round(grossAmount),
                };
            })
        );

        // Éves összesítő
        const yearlyTotal = monthlyData.reduce(
            (sum, month) => ({
                hours: sum.hours + month.hours,
                grossAmount: sum.grossAmount + month.grossAmount,
            }),
            { hours: 0, grossAmount: 0 }
        );

        return NextResponse.json({
            year,
            hourlyRate,
            monthlyData,
            yearlyTotal: {
                hours: Math.round(yearlyTotal.hours * 10) / 10,
                grossAmount: Math.round(yearlyTotal.grossAmount),
            },
        });
    } catch (error) {
        console.error("PAYROLL_YEARLY_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
