import getAllUsers from "@/app/actions/getAllUsers";
import Sidebar from "../components/sidebar/Sidebar";
import UserList from "./components/UserList";

export default async function UsersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const users = await getAllUsers();

    return (
        <Sidebar>
            <div className="h-full">
                <UserList items={users} />
                {children}
            </div>
        </Sidebar>
    );
}
