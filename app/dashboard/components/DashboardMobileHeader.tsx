"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiClock } from "react-icons/hi2";
import Image from "next/image";

const DashboardMobileHeader: React.FC = () => {
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
            today: "Today",
        },
        hu: {
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
        <div className="bg-white border-b border-gray-200 pb-4 mb-4">
            {/* Logo */}
            <div className="flex items-center justify-center py-4">
                <Image alt="logo" height="60" width="120" className='w-auto' src="/images/logo_big.png" />
            </div>

            {/* Date & Time Widget */}
            <div className="px-4">
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
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
        </div>
    );
};

export default DashboardMobileHeader;
