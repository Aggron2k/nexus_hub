// app/documents/layout.tsx
import getAllUsers from "@/app/actions/getAllUsers";
import getCurrentUser from "@/app/actions/getCurrentUser";
import Sidebar from "../components/sidebar/Sidebar";
import UserList from "./components/UserList";

export default async function UsersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();
    const allUsers = await getAllUsers();

    // Ha Employee, csak a saját profilját mutassuk
    const users = currentUser?.role === 'Employee'
        ? allUsers.filter(user => user.id === currentUser.id)
        : allUsers;

    return (
        <Sidebar>
            <div className="h-full">
                <UserList items={users} />
                {children}
            </div>
        </Sidebar>
    );
}
