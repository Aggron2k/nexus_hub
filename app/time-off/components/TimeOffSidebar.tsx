"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { HiUserGroup, HiUser } from "react-icons/hi2";
import Image from "next/image";
import VacationBalanceCard from "./VacationBalanceCard";

interface TimeOffSidebarProps {
  currentUser: User | null;
}

const TimeOffSidebar: React.FC<TimeOffSidebarProps> = ({ currentUser }) => {
  const { language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = currentUser?.role === "GeneralManager" || currentUser?.role === "CEO";
  const isOnAdminPage = pathname === "/time-off/admin";

  const translations = {
    en: {
      title: "Time Off",
      myTimeOff: "My Time-Off",
      teamOverview: "Team Overview",
    },
    hu: {
      title: "Szabadság",
      myTimeOff: "Saját Szabadságom",
      teamOverview: "Csapat Áttekintés",
    },
  };

  const t = translations[language];

  return (
    <aside className="hidden lg:fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200 bg-white">
      <div className="px-5">
        {/* Logo */}
        <div className="flex items-center justify-center py-6">
          <Image alt="logo" height="80" width="160" className='mx-auto w-auto' src="/images/logo_big.png" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-neutral-800">
              {t.title}
            </div>
          </div>
        </div>

        {/* Navigation Buttons - Admin Only */}
        {isAdmin && (
          <div className="mb-4 flex flex-col gap-2">
            <button
              onClick={() => router.push('/time-off')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                !isOnAdminPage
                  ? 'bg-nexus-tertiary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <HiUser className="h-5 w-5" />
              <span className="font-medium">{t.myTimeOff}</span>
            </button>
            <button
              onClick={() => router.push('/time-off/admin')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isOnAdminPage
                  ? 'bg-nexus-tertiary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <HiUserGroup className="h-5 w-5" />
              <span className="font-medium">{t.teamOverview}</span>
            </button>
          </div>
        )}

        {/* Vacation Balance Card Widget */}
        <VacationBalanceCard />
      </div>
    </aside>
  );
};

export default TimeOffSidebar;
