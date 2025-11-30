// prisma/clear-db.ts - MongoDB adatbázis törlése
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Adatbázis törlése...\n');

    // Sorrend fontos a foreign key kapcsolatok miatt
    console.log('Törlés: ActualWorkHours...');
    await prisma.actualWorkHours.deleteMany();

    console.log('Törlés: TimeOffRequest...');
    await prisma.timeOffRequest.deleteMany();

    console.log('Törlés: ShiftRequest...');
    await prisma.shiftRequest.deleteMany();

    console.log('Törlés: Shift...');
    await prisma.shift.deleteMany();

    console.log('Törlés: WeekSchedule...');
    await prisma.weekSchedule.deleteMany();

    console.log('Törlés: TodoAssignment...');
    await prisma.todoAssignment.deleteMany();

    console.log('Törlés: Todo...');
    await prisma.todo.deleteMany();

    console.log('Törlés: Document...');
    await prisma.document.deleteMany();

    console.log('Törlés: Account...');
    await prisma.account.deleteMany();

    console.log('Törlés: UserPosition...');
    await prisma.userPosition.deleteMany();

    console.log('Törlés: User...');
    await prisma.user.deleteMany();

    console.log('Törlés: Position...');
    await prisma.position.deleteMany();

    console.log('\n✅ Adatbázis sikeresen törölve!');
}

main()
    .catch((e) => {
        console.error('❌ Törlési hiba:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
