"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { HiUser, HiUserGroup } from "react-icons/hi2";
import Image from "next/image";
import VacationBalanceCard from "./VacationBalanceCard";

interface TimeOffMobileSelectorProps {
    onSelectMyTimeOff: () => void;
    onSelectTeamOverview: () => void;
}

const TimeOffMobileSelector: React.FC<TimeOffMobileSelectorProps> = ({
    onSelectMyTimeOff,
    onSelectTeamOverview,
}) => {
    const { language } = useLanguage();

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
        }
    };

    const t = translations[language];

    return (
        <div className="h-full bg-white overflow-y-auto pb-20">
            <div className="px-5">
                {/* Logo */}
                <div className="flex items-center justify-center py-6">
                    <Image alt="logo" height="80" width="160" className='mx-auto w-auto' src="/images/logo_big.png" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <div className="text-2xl font-bold text-neutral-800">
                            {t.title}
                        </div>
                    </div>
                </div>

                {/* Selection Buttons */}
                <div className="mb-6 flex flex-col gap-4">
                    <button
                        onClick={onSelectMyTimeOff}
                        className="flex items-center gap-3 px-6 py-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        <HiUser className="h-6 w-6" />
                        <span className="font-medium text-lg">{t.myTimeOff}</span>
                    </button>
                    <button
                        onClick={onSelectTeamOverview}
                        className="flex items-center gap-3 px-6 py-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        <HiUserGroup className="h-6 w-6" />
                        <span className="font-medium text-lg">{t.teamOverview}</span>
                    </button>
                </div>

                {/* Vacation Balance Card Widget */}
                <VacationBalanceCard />
            </div>
        </div>
    );
};

export default TimeOffMobileSelector;
