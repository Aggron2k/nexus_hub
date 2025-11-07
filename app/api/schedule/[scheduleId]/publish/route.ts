// app/api/schedule/[scheduleId]/publish/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function PATCH(
    request: Request,
    { params }: { params: { scheduleId: string } }
) {
    try {
        const currentUser = await getCurrentUser();

        // Csak GM/CEO publikálhat
        if (!currentUser || !['GeneralManager', 'CEO'].includes(currentUser.role)) {
            return new NextResponse("Unauthorized - Only GM/CEO can publish schedules", { status: 403 });
        }

        const { scheduleId } = params;
        const body = await request.json();
        const { isPublished } = body;

        if (!scheduleId) {
            return new NextResponse("Schedule ID required", { status: 400 });
        }

        if (typeof isPublished !== 'boolean') {
            return new NextResponse("isPublished field required (boolean)", { status: 400 });
        }

        // Ha publikálunk (true), akkor létrehozzuk az ActualWorkHours bejegyzéseket
        if (isPublished) {
            console.log(`📢 Publishing schedule ${scheduleId}...`);

            // Lekérjük az összes kitöltött műszakot ehhez a beosztáshoz
            const shifts = await prisma.shift.findMany({
                where: {
                    weekScheduleId: scheduleId,
                    // Csak azokat a shifteket, amiknek van startTime és endTime (nem placeholder)
                    startTime: { not: null },
                    endTime: { not: null }
                }
            });

            console.log(`👷 Found ${shifts.length} filled shifts to create ActualWorkHours for`);

            // Létrehozzuk az ActualWorkHours bejegyzéseket
            // MongoDB-nél nincs skipDuplicates, ezért egyenként próbáljuk létrehozni
            let createdCount = 0;

            for (const shift of shifts) {
                try {
                    // Ellenőrizzük hogy már létezik-e
                    const existing = await prisma.actualWorkHours.findUnique({
                        where: { shiftId: shift.id }
                    });

                    if (!existing) {
                        await prisma.actualWorkHours.create({
                            data: {
                                shiftId: shift.id,
                                userId: shift.userId,
                            }
                        });
                        createdCount++;
                    }
                } catch (error) {
                    console.error(`Error creating ActualWorkHours for shift ${shift.id}:`, error);
                    // Folytatjuk a következővel
                }
            }

            console.log(`✅ Created ${createdCount} new ActualWorkHours entries (${shifts.length - createdCount} already existed)`);
        } else {
            console.log(`📝 Unpublishing schedule ${scheduleId} (setting to draft)`);
            // Ha unpublish-eljük, NEM töröljük az ActualWorkHours bejegyzéseket
            // Ezek megmaradnak későbbi újra-publikáláskor
        }

        // Frissítjük a beosztás publikálási státuszát
        const updatedSchedule = await prisma.weekSchedule.update({
            where: {
                id: scheduleId
            },
            data: {
                isPublished: isPublished,
                updatedAt: new Date()
            }
        });

        console.log(`✅ Schedule ${scheduleId} ${isPublished ? 'published' : 'unpublished'} successfully`);

        return NextResponse.json(updatedSchedule);
    } catch (error) {
        console.error('PATCH /api/schedule/[scheduleId]/publish error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
