import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/libs/auth";

interface IParams {
  requestId: string;
}

// PUT - Műszak kérés módosítása (csak saját, PENDING státuszú kérés)
export async function PUT(
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

    const { requestId } = params;
    const body = await request.json();
    const { type, date, preferredStartTime, preferredEndTime, notes } = body;

    // Kérés lekérdezése
    const existingRequest = await prisma.shiftRequest.findUnique({
      where: { id: requestId },
      include: {
        weekSchedule: true,
      },
    });

    if (!existingRequest) {
      return new NextResponse("Kérés nem található", { status: 404 });
    }

    // Csak saját kérést lehet módosítani
    if (existingRequest.userId !== currentUser.id) {
      return new NextResponse("Csak saját kérést módosíthatsz", {
        status: 403,
      });
    }

    // Csak PENDING státuszú kérést lehet módosítani
    if (existingRequest.status !== "PENDING") {
      return new NextResponse(
        "Csak várakozó státuszú kérést lehet módosítani",
        { status: 400 }
      );
    }

    // Ellenőrizzük a határidőt
    const now = new Date();
    if (
      existingRequest.weekSchedule.requestDeadline &&
      now > existingRequest.weekSchedule.requestDeadline
    ) {
      return new NextResponse("A kérés módosítási határideje lejárt", {
        status: 400,
      });
    }

    // Validáció
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

    // Frissítés
    const updatedRequest = await prisma.shiftRequest.update({
      where: { id: requestId },
      data: {
        type: type || existingRequest.type,
        date: date ? new Date(date) : existingRequest.date,
        preferredStartTime: preferredStartTime
          ? new Date(preferredStartTime)
          : type === "SPECIFIC_TIME"
            ? existingRequest.preferredStartTime
            : null,
        preferredEndTime: preferredEndTime
          ? new Date(preferredEndTime)
          : type === "SPECIFIC_TIME"
            ? existingRequest.preferredEndTime
            : null,
        notes: notes !== undefined ? notes : existingRequest.notes,
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
  } catch (error) {
    console.error("[SHIFT_REQUEST_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Műszak kérés törlése (csak saját, PENDING státuszú kérés)
export async function DELETE(
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

    const { requestId } = params;

    // Kérés lekérdezése
    const existingRequest = await prisma.shiftRequest.findUnique({
      where: { id: requestId },
      include: {
        weekSchedule: true,
      },
    });

    if (!existingRequest) {
      return new NextResponse("Kérés nem található", { status: 404 });
    }

    // Csak saját kérést lehet törölni
    if (existingRequest.userId !== currentUser.id) {
      return new NextResponse("Csak saját kérést törölhetsz", { status: 403 });
    }

    // Csak PENDING státuszú kérést lehet törölni
    if (existingRequest.status !== "PENDING") {
      return new NextResponse("Csak várakozó státuszú kérést lehet törölni", {
        status: 400,
      });
    }

    // Ellenőrizzük a határidőt
    const now = new Date();
    if (
      existingRequest.weekSchedule.requestDeadline &&
      now > existingRequest.weekSchedule.requestDeadline
    ) {
      return new NextResponse("A kérés törlési határideje lejárt", {
        status: 400,
      });
    }

    // Törlés
    await prisma.shiftRequest.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ message: "Kérés sikeresen törölve" });
  } catch (error) {
    console.error("[SHIFT_REQUEST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
