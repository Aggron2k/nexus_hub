import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/libs/auth";

// GET - Fetch all shift requests for a specific week schedule (GM/CEO only)
export async function GET(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if user is GM or CEO
    const isGMOrCEO =
      currentUser.role === "GeneralManager" || currentUser.role === "CEO";

    // Build where clause based on role
    const where: any = {
      weekScheduleId: params.scheduleId,
    };

    // Employees only see their own shift requests
    if (!isGMOrCEO) {
      where.userId = currentUser.id;
    }

    const shiftRequests = await prisma.shiftRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userPositions: {
              include: {
                position: true,
              },
            },
          },
        },
        position: true,
        weekSchedule: {
          select: {
            id: true,
            weekStart: true,
            weekEnd: true,
            requestDeadline: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(shiftRequests);
  } catch (error) {
    console.error("[SCHEDULE_SHIFT_REQUESTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
