// app/schedule/page.tsx
"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { HiCalendar } from "react-icons/hi2";

export default function SchedulePage() {
    const { language } = useLanguage();

    const translations = {
        en: {
            title: "Schedule",
            selectWeek: "Select a week",
            description: "Choose a week from the list to view or edit the work schedule."
        },
        hu: {
            title: "Munkabeosztás",
            selectWeek: "Válassz egy hetet",
            description: "Válassz egy hetet a listából a munkabeosztás megtekintéséhez vagy szerkesztéséhez."
        }
    };

    const t = translations[language];

    return (
        <div className="hidden lg:block lg:pl-80 h-full">
            <div className="h-full flex flex-col bg-nexus-bg">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-nexus-primary rounded-lg">
                            <HiCalendar className="h-6 w-6 text-nexus-tertiary" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                    </div>
                </div>

                {/* Empty State */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <div className="mx-auto w-24 h-24 bg-nexus-primary rounded-full flex items-center justify-center mb-4">
                            <HiCalendar className="h-12 w-12 text-nexus-tertiary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {t.selectWeek}
                        </h2>
                        <p className="text-gray-600">
                            {t.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
