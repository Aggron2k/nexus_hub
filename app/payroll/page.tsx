"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";
import MonthlyHoursBreakdown from "./components/MonthlyHoursBreakdown";
import YearlySummary from "./components/YearlySummary";
import PaymentInfo from "./components/PaymentInfo";

export default function PayrollPage() {
    const { language } = useLanguage();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await axios.get('/api/users/me');
                setCurrentUser(userResponse.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const translations = {
        en: {
            loading: "Loading...",
        },
        hu: {
            loading: "Betöltés...",
        }
    };

    const t = translations[language];

    if (isLoading) {
        return (
            <div className="hidden lg:block lg:pl-80 h-full">
                <div className="h-full flex items-center justify-center bg-nexus-bg">
                    <p className="text-gray-500">{t.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="hidden lg:block lg:pl-80 h-full">
            <div className="h-full bg-nexus-bg p-6 overflow-y-auto">
                {/* Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Monthly Hours Breakdown - Full width on mobile, half on xl */}
                    <div className="xl:col-span-2">
                        <MonthlyHoursBreakdown />
                    </div>

                    {/* Yearly Summary - Left column */}
                    <div>
                        <YearlySummary />
                    </div>

                    {/* Payment Info - Right column */}
                    <div>
                        <PaymentInfo currentUser={currentUser} />
                    </div>
                </div>
            </div>
        </div>
    );
}
