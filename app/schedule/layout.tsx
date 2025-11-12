// app/schedule/layout.tsx
import getCurrentUser from '../actions/getCurrentUser';
import { redirect } from 'next/navigation';
import Sidebar from '../components/sidebar/Sidebar';
import ScheduleList from './components/ScheduleList';

export default async function ScheduleLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  // Csak GeneralManager és CEO hozhat létre beosztást
  const canManage = ['GeneralManager', 'CEO'].includes(currentUser.role);

  return (
    <Sidebar>
      <div className="h-full">
        <ScheduleList currentUser={currentUser} canManage={canManage} />
        {children}
      </div>
    </Sidebar>
  );
}
