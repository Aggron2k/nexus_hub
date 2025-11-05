import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

// DEBUG endpoint - Ellenőrzi hogy vannak-e userek és milyen adataik vannak
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Lekérjük AZ ÖSSZES usert minden szűrés nélkül
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employmentStatus: true,
        deletedAt: true,
        annualVacationDays: true,
        usedVacationDays: true,
        vacationYear: true,
      },
    });

    return NextResponse.json({
      currentUser: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      },
      totalUsers: allUsers.length,
      users: allUsers,
    });
  } catch (error) {
    console.error("[TIME_OFF_DEBUG_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
