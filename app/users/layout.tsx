import getAllUsers from '../actions/getAllUsers';
import getDeletedUsers from '../actions/getDeletedUsers';
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

  const users = await getAllUsers();
  const deletedUsers = await getDeletedUsers(); // CEO számára

  return (
    <Sidebar>
      <div className="h-full">
        <UserList items={users} deletedItems={deletedUsers} currentUser={currentUser} />
        {children}
      </div>
    </Sidebar>
  );
}