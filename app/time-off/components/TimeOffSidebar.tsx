"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { User } from "@prisma/client";
import { HiCalendar } from "react-icons/hi2";
import Image from "next/image";
import VacationBalanceCard from "./VacationBalanceCard";

interface TimeOffSidebarProps {
  currentUser: User | null;
}

const TimeOffSidebar: React.FC<TimeOffSidebarProps> = ({ currentUser }) => {
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Time Off",
    },
    hu: {
      title: "Szabadság",
    },
  };

  const t = translations[language];

  return (
    <aside className="hidden lg:fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200 bg-white">
      <div className="px-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-4">
          <div className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
              {t.title}
            </div>
        </div>

        {/* Vacation Balance Card Widget */}
        <div className="mb-4">
          <VacationBalanceCard />
        </div>
      </div>
    </aside>
  );
};

export default TimeOffSidebar;
