"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import MonthlyHoursBreakdown from "./components/MonthlyHoursBreakdown";
import YearlySummary from "./components/YearlySummary";
import PaymentInfo from "./components/PaymentInfo";
import PayrollMobileSelector from "./components/PayrollMobileSelector";
import PayrollMobileHeader from "./components/PayrollMobileHeader";

export default function PayrollPage() {
    const { language } = useLanguage();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showMobileSelector, setShowMobileSelector] = useState(true);

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
            myPayroll: "My Payroll",
        },
        hu: {
            loading: "Betöltés...",
            myPayroll: "Saját Bérem",
        }
    };

    const t = translations[language];
    const isAdmin = currentUser?.role === "GeneralManager" || currentUser?.role === "CEO";

    if (isLoading) {
        return (
            <>
                {/* Mobile Loading */}
                <div className="block lg:hidden h-full">
                    <div className="h-full flex items-center justify-center bg-nexus-bg">
                        <p className="text-gray-500">{t.loading}</p>
                    </div>
                </div>

                {/* Desktop Loading */}
                <div className="hidden lg:block lg:pl-80 h-full">
                    <div className="h-full flex items-center justify-center bg-nexus-bg">
                        <p className="text-gray-500">{t.loading}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Mobile View */}
            <div className="block lg:hidden h-full">
                {isAdmin && showMobileSelector ? (
                    // Mobile Selector (GM/CEO only)
                    <PayrollMobileSelector
                        onSelectMyPayroll={() => setShowMobileSelector(false)}
                        onSelectTeamPayroll={() => {
                            setShowMobileSelector(false);
                            router.push('/payroll/admin');
                        }}
                    />
                ) : (
                    // Mobile Content
                    <div className="h-full bg-nexus-bg overflow-y-auto pb-20">
                        {isAdmin && (
                            <PayrollMobileHeader
                                onBack={() => setShowMobileSelector(true)}
                                title={t.myPayroll}
                            />
                        )}

                        {/* Grid Layout */}
                        <div className="p-4 space-y-4">
                            {/* Monthly Hours Breakdown */}
                            <MonthlyHoursBreakdown />

                            {/* Yearly Summary */}
                            <YearlySummary />

                            {/* Payment Info */}
                            <PaymentInfo currentUser={currentUser} />
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop View */}
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
        </>
    );
}
