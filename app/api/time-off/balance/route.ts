import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

// GET /api/time-off/balance - Lekéri a bejelentkezett user szabadság egyenlegét
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Lekérjük a user adatait szabadság mezőkkel
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        annualVacationDays: true,
        usedVacationDays: true,
        vacationYear: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Lekérjük a függőben lévő TIME_OFF kéréseket (ShiftRequest)
    const pendingTimeOffRequests = await prisma.shiftRequest.findMany({
      where: {
        userId: currentUser.id,
        type: "TIME_OFF",
        status: "PENDING",
      },
      select: {
        id: true,
        date: true,
        vacationDays: true,
      },
    });

    // Számoljuk ki a függőben lévő napokat
    const pendingDays = pendingTimeOffRequests.reduce((sum, request) => {
      return sum + (request.vacationDays || 1); // Ha nincs vacationDays, 1 nap
    }, 0);

    // Lekérjük a jóváhagyott TimeOffRequest-eket is (VACATION típusú)
    const approvedTimeOffRequests = await prisma.timeOffRequest.findMany({
      where: {
        userId: currentUser.id,
        type: "VACATION",
        status: "APPROVED",
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        daysCount: true,
        deductedFromBalance: true,
      },
    });

    // Számoljuk ki a jóváhagyott napokat (amik már le lettek vonva)
    const approvedDays = approvedTimeOffRequests
      .filter((req) => req.deductedFromBalance)
      .reduce((sum, request) => sum + request.daysCount, 0);

    // Egyenleg számítás
    const totalAnnual = user.annualVacationDays;
    const used = user.usedVacationDays;
    const pending = pendingDays;
    const remaining = totalAnnual - used;
    const available = remaining - pending;

    return NextResponse.json({
      annualVacationDays: totalAnnual,
      usedVacationDays: used,
      pendingDays: pending,
      remainingDays: remaining,
      availableDays: available,
      vacationYear: user.vacationYear,
      usagePercentage: totalAnnual > 0 ? Math.round((used / totalAnnual) * 100) : 0,
    });
  } catch (error) {
    console.error("[TIME_OFF_BALANCE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
