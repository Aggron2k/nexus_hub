// app/messages/layout.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import ApplicationShell from "../components/navigation/ApplicationShell";
import MessagesSidebar from "./components/MessagesSidebar";


export const dynamic = 'force-dynamic';
export default async function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    return (
        <ApplicationShell>
            <div className="h-full">
                <MessagesSidebar currentUser={currentUser} />
                {children}
            </div>
        </ApplicationShell>
    );
}
