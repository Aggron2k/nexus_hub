// app/api/payroll/summary/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Aktuális hónap kezdete és vége
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Lekérjük az aktuális hónap összes ledolgozott óráját
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
                shift: true,
            },
        });

        // Összesítjük a ledolgozott órákat
        const totalHoursWorked = actualWorkHours.reduce(
            (sum, record) => sum + (record.actualHoursWorked || 0),
            0
        );

        // Órabér
        const hourlyRate = currentUser.hourlyRate || 0;

        // Bruttó összeg
        const grossAmount = totalHoursWorked * hourlyRate;

        // Elvárt havi órák (weeklyRequiredHours * 4)
        const expectedMonthlyHours = (currentUser.weeklyRequiredHours || 40) * 4;

        // Progress százalék
        const progressPercentage = expectedMonthlyHours > 0
            ? Math.min((totalHoursWorked / expectedMonthlyHours) * 100, 100)
            : 0;

        // Hónap hátralevő napjai
        const daysRemaining = monthEnd.getDate() - now.getDate();

        return NextResponse.json({
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
            expectedMonthlyHours,
            hourlyRate,
            grossAmount: Math.round(grossAmount),
            progressPercentage: Math.round(progressPercentage * 10) / 10,
            daysRemaining: Math.max(0, daysRemaining),
        });
    } catch (error) {
        console.error("PAYROLL_SUMMARY_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
