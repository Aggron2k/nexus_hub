// app/messages/layout.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import Sidebar from "../components/sidebar/Sidebar";
import MessagesSidebar from "./components/MessagesSidebar";

export default async function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    return (
        <Sidebar>
            <div className="h-full">
                <MessagesSidebar currentUser={currentUser} />
                {children}
            </div>
        </Sidebar>
    );
}
