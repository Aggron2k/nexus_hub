import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

// GET /api/time-off/team - Lekéri az összes alkalmazott szabadság egyenlegét (csak GM/CEO)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ellenőrizzük, hogy GM vagy CEO-e
    if (currentUser.role !== "GeneralManager" && currentUser.role !== "CEO") {
      return NextResponse.json(
        { error: "Forbidden - Only GM and CEO can access team vacation data" },
        { status: 403 }
      );
    }

    // Lekérjük az összes alkalmazottat (ideiglenesen deletedAt szűrő nélkül)
    const employees = await prisma.user.findMany({
      where: {
        // deletedAt: null, // Ideiglenesen kikommentelve
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        annualVacationDays: true,
        usedVacationDays: true,
        vacationYear: true,
        userPositions: {
          where: {
            isPrimary: true,
          },
          include: {
            position: {
              select: {
                name: true,
                displayNames: true,
              },
            },
          },
          take: 1,
        },
        _count: {
          select: {
            shiftRequests: {
              where: {
                type: "TIME_OFF",
                status: "PENDING",
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("[TIME_OFF_TEAM] Found employees:", employees.length);
    console.log("[TIME_OFF_TEAM] Sample employee:", employees[0]);

    // Számoljuk ki minden alkalmazott esetén a függőben lévő napokat
    const employeesWithBalance = await Promise.all(
      employees.map(async (employee) => {
        // Függőben lévő TIME_OFF kérések (ShiftRequest)
        const pendingShiftRequests = await prisma.shiftRequest.findMany({
          where: {
            userId: employee.id,
            type: "TIME_OFF",
            status: "PENDING",
          },
          select: {
            vacationDays: true,
          },
        });

        const pendingDays = pendingShiftRequests.reduce((sum, req) => {
          return sum + (req.vacationDays || 1);
        }, 0);

        // Függőben lévő TimeOffRequest-ek
        const pendingTimeOffRequests = await prisma.timeOffRequest.findMany({
          where: {
            userId: employee.id,
            type: "VACATION",
            status: "PENDING",
          },
          select: {
            daysCount: true,
          },
        });

        const pendingTimeOffDays = pendingTimeOffRequests.reduce((sum, req) => {
          return sum + req.daysCount;
        }, 0);

        const totalPending = pendingDays + pendingTimeOffDays;
        const totalAnnual = employee.annualVacationDays;
        const used = employee.usedVacationDays;
        const remaining = totalAnnual - used;
        const available = remaining - totalPending;

        return {
          id: employee.id,
          name: employee.name || "Unknown",
          email: employee.email,
          role: employee.role,
          position: employee.userPositions[0]?.position?.displayNames?.en ||
                    employee.userPositions[0]?.position?.name ||
                    "No Position",
          annualVacationDays: totalAnnual,
          usedVacationDays: used,
          pendingDays: totalPending,
          remainingDays: remaining,
          availableDays: available,
          usagePercentage: totalAnnual > 0 ? Math.round((used / totalAnnual) * 100) : 0,
        };
      })
    );

    console.log("[TIME_OFF_TEAM] Processed employees:", employeesWithBalance.length);
    console.log("[TIME_OFF_TEAM] Sample result:", employeesWithBalance[0]);

    return NextResponse.json(employeesWithBalance);
  } catch (error) {
    console.error("[TIME_OFF_TEAM_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
