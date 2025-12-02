// app/payroll/layout.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import ApplicationShell from "../components/navigation/ApplicationShell";
import PayrollSidebar from "./components/PayrollSidebar";

export default async function PayrollLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    return (
        <ApplicationShell>
            <div className="h-full">
                <PayrollSidebar currentUser={currentUser} />
                {children}
            </div>
        </ApplicationShell>
    );
}
