import getCurrentUser from '../actions/getCurrentUser';
import { redirect } from 'next/navigation';
import ApplicationShell from '../components/navigation/ApplicationShell';
import WeekList from './components/WeekList';
import databaseClient from '@/app/libs/prismadb';

const prisma = databaseClient;

export default async function MyRequestsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  // Fetch week schedules
  const weekSchedules = await prisma.weekSchedule.findMany({
    orderBy: {
      weekStart: 'asc'
    },
    include: {
      shiftRequests: {
        where: {
          userId: currentUser.id
        },
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  return (
    <ApplicationShell>
      <div className="h-full">
        <WeekList
          weekSchedules={weekSchedules}
          currentUser={currentUser}
        />
        {children}
      </div>
    </ApplicationShell>
  );
}
