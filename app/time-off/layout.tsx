// app/time-off/layout.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import { redirect } from "next/navigation";
import ApplicationShell from "../components/navigation/ApplicationShell";
import TimeOffSidebar from "./components/TimeOffSidebar";


export const dynamic = 'force-dynamic';
export default async function TimeOffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return (
    <ApplicationShell>
      <div className="h-full">
        <TimeOffSidebar currentUser={currentUser} />
        {children}
      </div>
    </ApplicationShell>
  );
}
