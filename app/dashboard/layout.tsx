// app/dashboard/layout.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import ApplicationShell from "../components/navigation/ApplicationShell";
import DashboardSidebar from "./components/DashboardSidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    return (
        <ApplicationShell>
            <div className="h-full">
                <DashboardSidebar currentUser={currentUser} />
                {children}
            </div>
        </ApplicationShell>
    );
}
