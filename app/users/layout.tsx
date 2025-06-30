import getUsers from '../actions/getUsers';
import getCurrentUser from '../actions/getCurrentUser';
import { redirect } from 'next/navigation';
import Sidebar from '../components/sidebar/Sidebar';
import UserList from './components/UserList';

export default async function UsersLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const users = await getUsers();

  return (
    <Sidebar>
      <div className="h-full">
        <UserList items={users} currentUser={currentUser} />
        {children}
      </div>
    </Sidebar>
  );
}