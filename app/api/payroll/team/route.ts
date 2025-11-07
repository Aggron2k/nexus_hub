// app/api/payroll/team/route.ts
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
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        // Hónap kezdete és vége
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        // Lekérjük az összes dolgozót
        const users = await prisma.user.findMany({
            where: {
                employmentStatus: "ACTIVE",
            },
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

        // Minden dolgozóhoz lekérjük a ledolgozott órákat
        const employeePayrollData = await Promise.all(
            users.map(async (user) => {
                const actualWorkHours = await prisma.actualWorkHours.findMany({
                    where: {
                        userId: user.id,
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

                const hourlyRate = user.hourlyRate || 0;
                const grossAmount = totalHours * hourlyRate;

                return {
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                    position: user.userPositions[0]?.position?.displayNames || null,
                    hours: Math.round(totalHours * 10) / 10,
                    hourlyRate,
                    grossAmount: Math.round(grossAmount),
                };
            })
        );

        // Csapat összesítő
        const teamSummary = employeePayrollData.reduce(
            (sum, employee) => ({
                totalHours: sum.totalHours + employee.hours,
                totalGrossAmount: sum.totalGrossAmount + employee.grossAmount,
                employeeCount: sum.employeeCount + 1,
            }),
            { totalHours: 0, totalGrossAmount: 0, employeeCount: 0 }
        );

        teamSummary.totalHours = Math.round(teamSummary.totalHours * 10) / 10;
        teamSummary.totalGrossAmount = Math.round(teamSummary.totalGrossAmount);

        const averageHours = teamSummary.employeeCount > 0
            ? Math.round((teamSummary.totalHours / teamSummary.employeeCount) * 10) / 10
            : 0;

        const averageGrossAmount = teamSummary.employeeCount > 0
            ? Math.round(teamSummary.totalGrossAmount / teamSummary.employeeCount)
            : 0;

        return NextResponse.json({
            year,
            month,
            teamSummary: {
                ...teamSummary,
                averageHours,
                averageGrossAmount,
            },
            employees: employeePayrollData.sort((a, b) => b.grossAmount - a.grossAmount),
        });
    } catch (error) {
        console.error("PAYROLL_TEAM_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
