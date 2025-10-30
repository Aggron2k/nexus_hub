import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/libs/auth";

// POST - Új műszak kérés létrehozása (Employee által)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userPositions: {
          include: {
            position: true
          }
        }
      }
    });

    if (!currentUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Ellenőrzés: csak ACTIVE employee küldhet kérést
    if (currentUser.employmentStatus !== "ACTIVE") {
      return new NextResponse(
        "Csak aktív státuszú alkalmazottak küldhetnek műszak kérést",
        { status: 403 }
      );
    }

    // Ellenőrzés: van-e legalább 1 pozíciója
    if (!currentUser.userPositions || currentUser.userPositions.length === 0) {
      return new NextResponse(
        "Nincs hozzárendelt pozíciód. Kérj pozíció hozzárendelést a menedzsertől.",
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      weekScheduleId,
      type,
      date,
      preferredStartTime,
      preferredEndTime,
      notes,
    } = body;

    // Validáció
    if (!weekScheduleId || !type || !date) {
      return new NextResponse("Hiányzó kötelező mezők", { status: 400 });
    }

    // Ellenőrizzük, hogy a week schedule létezik-e
    const weekSchedule = await prisma.weekSchedule.findUnique({
      where: { id: weekScheduleId },
    });

    if (!weekSchedule) {
      return new NextResponse("A megadott heti beosztás nem található", {
        status: 404,
      });
    }

    // Ellenőrizzük a határidőt (ha van beállítva)
    const now = new Date();
    if (weekSchedule.requestDeadline && now > weekSchedule.requestDeadline) {
      return new NextResponse(
        "A kérés benyújtási határideje lejárt. Határidő: " +
        weekSchedule.requestDeadline.toLocaleString("hu-HU"),
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy a dátum a heti beosztás időszakába esik-e
    const requestDate = new Date(date);
    const weekStartDate = new Date(weekSchedule.weekStart);
    const weekEndDate = new Date(weekSchedule.weekEnd);

    // Normalizáljuk a dátumokat (csak nap, hónap, év)
    requestDate.setHours(0, 0, 0, 0);
    weekStartDate.setHours(0, 0, 0, 0);
    weekEndDate.setHours(23, 59, 59, 999);

    if (requestDate < weekStartDate || requestDate > weekEndDate) {
      return new NextResponse(
        `A kért dátum nem esik a heti beosztás időszakába (${weekSchedule.weekStart.toLocaleDateString("hu-HU")} - ${weekSchedule.weekEnd.toLocaleDateString("hu-HU")})`,
        { status: 400 }
      );
    }

    // SPECIFIC_TIME esetén kötelező a kezdő és befejező idő
    if (type === "SPECIFIC_TIME") {
      if (!preferredStartTime || !preferredEndTime) {
        return new NextResponse(
          "Konkrét időpont választásakor kötelező a kezdő és befejező időt megadni",
          { status: 400 }
        );
      }

      const startTime = new Date(preferredStartTime);
      const endTime = new Date(preferredEndTime);

      if (startTime >= endTime) {
        return new NextResponse(
          "A befejező időpontnak később kell lennie, mint a kezdő időpont",
          { status: 400 }
        );
      }
    }

    // Ellenőrizzük, hogy a user-nek van-e már kérése erre a napra
    const existingRequest = await prisma.shiftRequest.findFirst({
      where: {
        userId: currentUser.id,
        weekScheduleId: weekScheduleId,
        date: new Date(date),
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    if (existingRequest) {
      return new NextResponse(
        "Már van aktív kérésed erre a napra",
        { status: 409 }
      );
    }

    // TIME_OFF esetén ellenőrizzük, hogy nincs-e már más típusú kérés aznap
    if (type === "TIME_OFF") {
      const otherRequestsOnDay = await prisma.shiftRequest.findFirst({
        where: {
          userId: currentUser.id,
          weekScheduleId: weekScheduleId,
          date: new Date(date),
          status: {
            in: ["PENDING", "APPROVED"],
          },
          type: {
            not: "TIME_OFF",
          },
        },
      });

      if (otherRequestsOnDay) {
        return new NextResponse(
          "Szabadság kérése esetén nem lehet más műszak kérés ugyanarra a napra",
          { status: 409 }
        );
      }
    }

    // Ha nem TIME_OFF, ellenőrizzük hogy nincs-e TIME_OFF kérés aznap
    if (type !== "TIME_OFF") {
      const timeOffRequest = await prisma.shiftRequest.findFirst({
        where: {
          userId: currentUser.id,
          weekScheduleId: weekScheduleId,
          date: new Date(date),
          type: "TIME_OFF",
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      });

      if (timeOffRequest) {
        return new NextResponse(
          "Erre a napra már van szabadság kérésed, nem kérhetsz műszakot",
          { status: 409 }
        );
      }
    }

    // Kérés létrehozása (positionId null - GM/CEO tölti ki később)
    const shiftRequest = await prisma.shiftRequest.create({
      data: {
        weekScheduleId,
        userId: currentUser.id,
        positionId: null, // Employee nem választ pozíciót
        type,
        date: new Date(date),
        preferredStartTime: preferredStartTime
          ? new Date(preferredStartTime)
          : null,
        preferredEndTime: preferredEndTime ? new Date(preferredEndTime) : null,
        notes: notes || null,
        status: "PENDING",
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

    return NextResponse.json(shiftRequest);
  } catch (error) {
    console.error("[SHIFT_REQUEST_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// GET - Műszak kérések lekérdezése
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const weekScheduleId = searchParams.get("weekScheduleId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    // Alap where feltétel
    let where: any = {};

    // Ha nem GM/CEO, csak saját kéréseket láthat
    if (
      currentUser.role !== "GeneralManager" &&
      currentUser.role !== "CEO"
    ) {
      where.userId = currentUser.id;
    } else {
      // GM/CEO esetén ha van userId paraméter, azt szűrjük
      if (userId) {
        where.userId = userId;
      }
    }

    if (weekScheduleId) {
      where.weekScheduleId = weekScheduleId;
    }

    if (status) {
      where.status = status;
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
    console.error("[SHIFT_REQUEST_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
