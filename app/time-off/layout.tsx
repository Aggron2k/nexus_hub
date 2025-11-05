// app/time-off/layout.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import { redirect } from "next/navigation";
import Sidebar from "../components/sidebar/Sidebar";
import TimeOffSidebar from "./components/TimeOffSidebar";

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
    <Sidebar>
      <div className="h-full">
        <TimeOffSidebar currentUser={currentUser} />
        {children}
      </div>
    </Sidebar>
  );
}
