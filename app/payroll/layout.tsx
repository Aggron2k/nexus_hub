// app/payroll/layout.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import Sidebar from "../components/sidebar/Sidebar";
import PayrollSidebar from "./components/PayrollSidebar";

export default async function PayrollLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    return (
        <Sidebar>
            <div className="h-full">
                <PayrollSidebar currentUser={currentUser} />
                {children}
            </div>
        </Sidebar>
    );
}
