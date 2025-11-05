import getCurrentUser from "@/app/actions/getCurrentUser";
import { redirect } from "next/navigation";
import VacationRequestsList from "./components/VacationRequestsList";
import VacationCalendar from "./components/VacationCalendar";

export default async function TimeOffPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Ha GM vagy CEO, átirányítjuk az admin oldalra
  if (currentUser.role === "GeneralManager" || currentUser.role === "CEO") {
    redirect("/time-off/admin");
  }

  return (
    <div className="hidden lg:block lg:pl-80 h-full">
      <div className="h-full bg-nexus-bg p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Requests List */}
          <VacationRequestsList />

          {/* Calendar */}
          <VacationCalendar />
        </div>
      </div>
    </div>
  );
}
