import getCurrentUser from "@/app/actions/getCurrentUser";
import { redirect } from "next/navigation";
import EmployeeBalanceTable from "../components/EmployeeBalanceTable";

export default async function TimeOffAdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Csak GM és CEO férhet hozzá
  if (currentUser.role !== "GeneralManager" && currentUser.role !== "CEO") {
    redirect("/time-off");
  }

  return (
    <div className="hidden lg:block lg:pl-80 h-full">
      <div className="h-full bg-nexus-bg p-6 overflow-y-auto">
        <EmployeeBalanceTable />
      </div>
    </div>
  );
}
