// app/documents/layout.tsx
import getAllUsers from "@/app/actions/getAllUsers";
import getDeletedUsers from "@/app/actions/getDeletedUsers";
import getCurrentUser from "@/app/actions/getCurrentUser";
import ApplicationShell from "../components/navigation/ApplicationShell";
import UserList from "./components/UserList";

export default async function UsersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();
    const allUsers = await getAllUsers();
    const deletedUsers = await getDeletedUsers(); // CEO számára

    // Ha Employee, csak a saját profilját mutassuk
    const users = currentUser?.role === 'Employee'
        ? allUsers.filter(user => user.id === currentUser.id)
        : allUsers;

    return (
        <ApplicationShell>
            <div className="h-full">
                <UserList items={users} deletedItems={deletedUsers} currentUser={currentUser} />
                {children}
            </div>
        </ApplicationShell>
    );
}
