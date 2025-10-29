import getCurrentUser from '../actions/getCurrentUser';
import { redirect } from 'next/navigation';
import Sidebar from '../components/sidebar/Sidebar';
import WeekList from './components/WeekList';
import prisma from '@/app/libs/prismadb';

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
    <Sidebar>
      <div className="h-full">
        <WeekList
          weekSchedules={weekSchedules}
          currentUser={currentUser}
        />
        {children}
      </div>
    </Sidebar>
  );
}
