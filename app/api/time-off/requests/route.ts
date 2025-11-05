import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

// GET /api/time-off/requests - Lekéri a bejelentkezett user összes TIME_OFF kérését
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // URL paraméterek
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED
    const year = searchParams.get("year"); // 2025, 2024, stb.

    // ShiftRequest típusú TIME_OFF kérések (meglévő rendszer)
    const shiftRequestFilter: any = {
      userId: currentUser.id,
      type: "TIME_OFF",
    };

    if (status) {
      shiftRequestFilter.status = status;
    }

    if (year) {
      const yearInt = parseInt(year);
      shiftRequestFilter.date = {
        gte: new Date(`${yearInt}-01-01`),
        lte: new Date(`${yearInt}-12-31`),
      };
    }

    const shiftRequests = await prisma.shiftRequest.findMany({
      where: shiftRequestFilter,
      include: {
        weekSchedule: {
          select: {
            weekStart: true,
            weekEnd: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // TimeOffRequest típusú kérések (új rendszer)
    const timeOffRequestFilter: any = {
      userId: currentUser.id,
      type: "VACATION",
    };

    if (status) {
      timeOffRequestFilter.status = status;
    }

    if (year) {
      const yearInt = parseInt(year);
      timeOffRequestFilter.startDate = {
        gte: new Date(`${yearInt}-01-01`),
        lte: new Date(`${yearInt}-12-31`),
      };
    }

    const timeOffRequests = await prisma.timeOffRequest.findMany({
      where: timeOffRequestFilter,
      orderBy: {
        startDate: "desc",
      },
    });

    // Kombinálva visszaadjuk mindkettőt
    const combinedRequests = [
      ...shiftRequests.map((req) => ({
        id: req.id,
        type: "shift_request" as const,
        status: req.status,
        date: req.date,
        startDate: req.date,
        endDate: req.date,
        daysCount: req.vacationDays || 1,
        notes: req.notes,
        rejectionReason: req.rejectionReason,
        reviewedById: req.reviewedById,
        reviewedAt: req.reviewedAt,
        createdAt: req.createdAt,
        weekSchedule: req.weekSchedule,
      })),
      ...timeOffRequests.map((req) => ({
        id: req.id,
        type: "time_off_request" as const,
        status: req.status,
        date: req.startDate,
        startDate: req.startDate,
        endDate: req.endDate,
        daysCount: req.daysCount,
        notes: req.notes,
        rejectionReason: req.rejectionReason,
        reviewedById: req.reviewedById,
        reviewedAt: req.reviewedAt,
        createdAt: req.createdAt,
        sickLeaveDocumentUrl: req.sickLeaveDocumentUrl,
      })),
    ];

    // Dátum szerint rendezzük
    combinedRequests.sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return NextResponse.json(combinedRequests);
  } catch (error) {
    console.error("[TIME_OFF_REQUESTS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
