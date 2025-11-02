import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/libs/auth";

interface IParams {
  requestId: string;
}

// Időpont átfedés ellenőrzése
function hasTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

// POST - Jóváhagyott műszak kérés konvertálása műszakká (csak GM/CEO)
export async function POST(
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

    // Csak GM/CEO konvertálhat
    if (
      currentUser.role !== "GeneralManager" &&
      currentUser.role !== "CEO"
    ) {
      return new NextResponse(
        "Csak General Manager vagy CEO konvertálhat kéréseket",
        { status: 403 }
      );
    }

    const { requestId } = params;
    const body = await request.json();
    const { positionId, startTime, endTime, notes } = body;

    // Validáció
    if (!positionId) {
      return new NextResponse("Pozíció kiválasztása kötelező", {
        status: 400,
      });
    }

    if (!startTime || !endTime) {
      return new NextResponse("Kezdő és befejező időpont kötelező", {
        status: 400,
      });
    }

    const shiftStartTime = new Date(startTime);
    const shiftEndTime = new Date(endTime);

    if (shiftStartTime >= shiftEndTime) {
      return new NextResponse(
        "A befejező időpontnak később kell lennie, mint a kezdő időpont",
        { status: 400 }
      );
    }

    // Kérés lekérdezése
    const existingRequest = await prisma.shiftRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            userPositions: {
              include: {
                position: true
              }
            }
          }
        },
        position: true,
        weekSchedule: true,
      },
    });

    if (!existingRequest) {
      return new NextResponse("Kérés nem található", { status: 404 });
    }

    // Csak PENDING vagy APPROVED státuszú kérést lehet konvertálni
    // (REJECTED vagy CONVERTED_TO_SHIFT nem)
    if (existingRequest.status !== "PENDING" && existingRequest.status !== "APPROVED") {
      return new NextResponse("Ezt a kérést már nem lehet műszakká alakítani (már elutasítva vagy konvertálva)", {
        status: 400,
      });
    }

    // TIME_OFF típusú kérést nem lehet műszakká alakítani
    if (existingRequest.type === "TIME_OFF") {
      return new NextResponse(
        "Szabadság kérést nem lehet műszakká alakítani",
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy a kiválasztott pozíció az employee UserPositions listájában van-e
    const userPositionIds = existingRequest.user.userPositions.map((up: any) => up.positionId);
    if (!userPositionIds.includes(positionId)) {
      return new NextResponse(
        "A kiválasztott pozíció nincs az alkalmazott pozíciói között",
        { status: 400 }
      );
    }

    // Ellenőrizzük az átfedéseket (csak ugyanazon user-re, és csak kitöltött műszakoknál)
    const existingShifts = await prisma.shift.findMany({
      where: {
        userId: existingRequest.userId,
        date: existingRequest.date,
        startTime: { not: null }, // Csak kitöltött műszakokat ellenőrizzük
        endTime: { not: null }
      },
    });

    for (const existingShift of existingShifts) {
      // TypeScript check - csak akkor ellenőrizzük ha tényleg kitöltött
      if (existingShift.startTime && existingShift.endTime) {
        if (
          hasTimeOverlap(
            shiftStartTime,
            shiftEndTime,
            existingShift.startTime,
            existingShift.endTime
          )
        ) {
          const existingStart = existingShift.startTime.toLocaleTimeString(
            "hu-HU",
            { hour: "2-digit", minute: "2-digit" }
          );
          const existingEnd = existingShift.endTime.toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return new NextResponse(
            `A felhasználónak már van műszakja ezen az időpontban: ${existingStart} - ${existingEnd}`,
            { status: 409 }
          );
        }
      }
    }

    // Számítsuk ki a ledolgozott órákat
    const hoursWorked =
      (shiftEndTime.getTime() - shiftStartTime.getTime()) / (1000 * 60 * 60);

    // Shift létrehozása tranzakcióban
    const result = await prisma.$transaction(async (tx) => {
      // Shift létrehozása a GM/CEO által kiválasztott pozícióval
      const newShift = await tx.shift.create({
        data: {
          weekScheduleId: existingRequest.weekScheduleId,
          userId: existingRequest.userId,
          positionId: positionId, // A body-ból jövő positionId
          shiftRequestId: existingRequest.id,
          date: existingRequest.date,
          startTime: shiftStartTime,
          endTime: shiftEndTime,
          hoursWorked: hoursWorked,
          notes: notes || existingRequest.notes,
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

      // Kérés státuszának frissítése és pozíció mentése
      await tx.shiftRequest.update({
        where: { id: requestId },
        data: {
          status: "CONVERTED_TO_SHIFT",
          positionId: positionId, // Elmentsük melyik pozícióra lett konvertálva
        },
      });

      return newShift;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[SHIFT_REQUEST_CONVERT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
