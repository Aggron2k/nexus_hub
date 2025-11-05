import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/libs/auth";

interface IParams {
  requestId: string;
}

// PATCH - Műszak kérés jóváhagyása/elutasítása (csak GM/CEO)
export async function PATCH(
  request: NextRequest,
  { params }: { params: IParams }
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

    // Csak GM/CEO hagyhat jóvá/utasíthat el
    if (
      currentUser.role !== "GeneralManager" &&
      currentUser.role !== "CEO"
    ) {
      return new NextResponse(
        "Csak General Manager vagy CEO hagyhat jóvá kéréseket",
        { status: 403 }
      );
    }

    const { requestId } = params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    // Validáció
    if (!action || !["approve", "reject"].includes(action)) {
      return new NextResponse('Az action csak "approve" vagy "reject" lehet', {
        status: 400,
      });
    }

    if (action === "reject" && !rejectionReason) {
      return new NextResponse("Elutasítás esetén kötelező az indoklás", {
        status: 400,
      });
    }

    // Kérés lekérdezése
    const existingRequest = await prisma.shiftRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        position: true,
        weekSchedule: true,
      },
    });

    if (!existingRequest) {
      return new NextResponse("Kérés nem található", { status: 404 });
    }

    // Csak PENDING státuszú kérést lehet review-zni
    if (existingRequest.status !== "PENDING") {
      return new NextResponse("Csak várakozó státuszú kérést lehet elbírálni", {
        status: 400,
      });
    }

    if (action === "approve") {
      // Jóváhagyás
      // Ha TIME_OFF típusú kérés, levonjuk a szabadság napokat
      if (existingRequest.type === "TIME_OFF" && !existingRequest.deductedFromBalance) {
        const daysToDeduct = existingRequest.vacationDays || 1;

        // Transaction-ben frissítjük mindkettőt
        const [updatedRequest, updatedUser] = await prisma.$transaction([
          prisma.shiftRequest.update({
            where: { id: requestId },
            data: {
              status: "APPROVED",
              reviewedById: currentUser.id,
              reviewedAt: new Date(),
              deductedFromBalance: true,
              vacationDays: daysToDeduct,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              position: true,
              weekSchedule: true,
            },
          }),
          prisma.user.update({
            where: { id: existingRequest.userId },
            data: {
              usedVacationDays: {
                increment: daysToDeduct,
              },
            },
          }),
        ]);

        return NextResponse.json(updatedRequest);
      } else {
        // Nem TIME_OFF típusú kérés, normál jóváhagyás
        const updatedRequest = await prisma.shiftRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedById: currentUser.id,
            reviewedAt: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            position: true,
            weekSchedule: true,
          },
        });

        return NextResponse.json(updatedRequest);
      }
    } else {
      // Elutasítás
      const updatedRequest = await prisma.shiftRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason,
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          position: true,
          weekSchedule: true,
        },
      });

      return NextResponse.json(updatedRequest);
    }
  } catch (error) {
    console.error("[SHIFT_REQUEST_REVIEW]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
