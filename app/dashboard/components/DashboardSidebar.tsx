"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { User } from "@prisma/client";
import { HiHome, HiClock } from "react-icons/hi2";
import Image from "next/image";

interface DashboardSidebarProps {
    currentUser: User | null;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ currentUser }) => {
    const { language } = useLanguage();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Óra frissítése minden másodpercben
    useEffect(() => {
        setIsMounted(true);
        setCurrentTime(new Date());

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const translations = {
        en: {
            title: "Dashboard",
            today: "Today",
        },
        hu: {
            title: "Irányítópult",
            today: "Ma",
        }
    };

    const t = translations[language];

    // Formázott dátum
    const formatDate = () => {
        if (!currentTime || !isMounted) return '---';
        return currentTime.toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    // Formázott idő
    const formatTime = () => {
        if (!currentTime || !isMounted) return '--:--:--';
        return currentTime.toLocaleTimeString(language === 'hu' ? 'hu-HU' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <aside className="fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200 bg-white">
            <div className="px-5">
                {/* Logo */}
                <div className="flex items-center justify-center py-6">
                    <Image alt="logo" height="80" width="160" className='mx-auto w-auto' src="/images/logo_big.png" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-nexus-primary rounded-lg">
                            <HiHome className="h-6 w-6 text-nexus-tertiary" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-800">
                            {t.title}
                        </div>
                    </div>
                </div>

                {/* Date & Time Widget */}
                <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <HiClock className="h-5 w-5 text-nexus-tertiary" />
                        <h3 className="text-sm font-semibold text-gray-700">{t.today}</h3>
                    </div>

                    {/* Date */}
                    <div className="mb-2">
                        <p className="text-xs text-gray-500">{language === 'hu' ? 'Dátum' : 'Date'}</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate()}</p>
                    </div>

                    {/* Time */}
                    <div>
                        <p className="text-xs text-gray-500">{language === 'hu' ? 'Idő' : 'Time'}</p>
                        <p className="text-2xl font-bold text-nexus-tertiary tabular-nums">{formatTime()}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default DashboardSidebar;
