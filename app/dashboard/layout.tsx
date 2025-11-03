// app/dashboard/layout.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import Sidebar from "../components/sidebar/Sidebar";
import DashboardSidebar from "./components/DashboardSidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    return (
        <Sidebar>
            <div className="h-full">
                <DashboardSidebar currentUser={currentUser} />
                {children}
            </div>
        </Sidebar>
    );
}
