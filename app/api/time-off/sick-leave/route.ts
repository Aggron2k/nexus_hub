import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

// PATCH /api/time-off/sick-leave - Betegszabadság dokumentum feltöltése
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timeOffRequestId, documentUrl } = body;

    if (!timeOffRequestId || !documentUrl) {
      return NextResponse.json(
        { error: "timeOffRequestId and documentUrl are required" },
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy létezik-e a TimeOffRequest és a user tulajdonosa-e
    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id: timeOffRequestId },
      select: {
        id: true,
        userId: true,
        type: true,
      },
    });

    if (!timeOffRequest) {
      return NextResponse.json(
        { error: "Time-off request not found" },
        { status: 404 }
      );
    }

    // Csak a saját kéréshez tölthet fel dokumentumot
    if (timeOffRequest.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only upload documents for your own requests" },
        { status: 403 }
      );
    }

    // Csak SICK_LEAVE típusú kéréshez lehet dokumentumot feltölteni
    if (timeOffRequest.type !== "SICK_LEAVE") {
      return NextResponse.json(
        { error: "Documents can only be uploaded for SICK_LEAVE requests" },
        { status: 400 }
      );
    }

    // Frissítjük a TimeOffRequest-et a dokumentum URL-lel
    const updatedRequest = await prisma.timeOffRequest.update({
      where: { id: timeOffRequestId },
      data: {
        sickLeaveDocumentUrl: documentUrl,
        documentUploadedAt: new Date(),
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[SICK_LEAVE_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
