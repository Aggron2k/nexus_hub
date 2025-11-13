"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";
import WelcomeCard from "./components/WelcomeCard";
import HourSummaryWidget from "../components/HourSummaryWidget";
import TodoStats from "../todos/components/TodoStats";
import UserPositionsCard from "./components/UserPositionsCard";
import VacationBalanceCard from "../time-off/components/VacationBalanceCard";
import PayrollSummaryWidget from "../payroll/components/PayrollSummaryWidget";
import DashboardMobileHeader from "./components/DashboardMobileHeader";

export default function DashboardPage() {
    const { language } = useLanguage();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [latestSchedule, setLatestSchedule] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Lekérjük a bejelentkezett felhasználót és a legutóbbi schedule-t
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Current user
                const userResponse = await axios.get('/api/users/me');
                setCurrentUser(userResponse.data);

                // Latest schedule (legfrissebb published schedule)
                const scheduleResponse = await axios.get('/api/schedule');
                if (scheduleResponse.data && scheduleResponse.data.length > 0) {
                    // Megkeressük a legutóbbi publikált schedule-t
                    const publishedSchedules = scheduleResponse.data.filter((s: any) => s.isPublished);
                    if (publishedSchedules.length > 0) {
                        setLatestSchedule(publishedSchedules[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <>
                {/* Mobile Loading */}
                <div className="block lg:hidden h-full">
                    <div className="h-full flex items-center justify-center bg-nexus-bg">
                        <p className="text-gray-500">{language === 'hu' ? 'Betöltés...' : 'Loading...'}</p>
                    </div>
                </div>

                {/* Desktop Loading */}
                <div className="hidden lg:block lg:pl-80 h-full">
                    <div className="h-full flex items-center justify-center bg-nexus-bg">
                        <p className="text-gray-500">{language === 'hu' ? 'Betöltés...' : 'Loading...'}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Mobile View */}
            <div className="block lg:hidden h-full bg-nexus-bg overflow-y-auto pb-20">
                {/* Mobile Header - Logo + Time */}
                <DashboardMobileHeader />

                {/* Widgets - 1 oszlopban egymás alatt */}
                <div className="px-4 space-y-4">
                    {/* Welcome Card */}
                    <WelcomeCard user={currentUser} />

                    {/* Hour Summary Widget */}
                    {latestSchedule && (
                        <HourSummaryWidget
                            weekScheduleId={latestSchedule.id}
                            weekStart={latestSchedule.weekStart}
                            weekEnd={latestSchedule.weekEnd}
                        />
                    )}

                    {/* Vacation Balance Card */}
                    <VacationBalanceCard />

                    {/* Payroll Summary Widget */}
                    <PayrollSummaryWidget />

                    {/* Todo Stats */}
                    <TodoStats />

                    {/* User Positions */}
                    <UserPositionsCard user={currentUser} />
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block lg:pl-80 h-full">
                <div className="h-full bg-nexus-bg p-6 overflow-y-auto">
                    <div className="space-y-6">
                        
                        {/* Első sor: Welcome Card + User Positions (2 egyenlő oszlop) */}
                        <div className="grid grid-cols-2 gap-6">
                            <WelcomeCard user={currentUser} />
                            <UserPositionsCard user={currentUser} />
                        </div>

                        {/* Második sor: Vacation Balance + Payroll Summary + Hour Summary (3 egyenlő oszlop) */}
                        <div className="grid grid-cols-3 gap-6">
                            <VacationBalanceCard />
                            <PayrollSummaryWidget />
                            {latestSchedule && (
                                <HourSummaryWidget
                                    weekScheduleId={latestSchedule.id}
                                    weekStart={latestSchedule.weekStart}
                                    weekEnd={latestSchedule.weekEnd}
                                />
                            )}
                        </div>

                        {/* Harmadik sor: Todo Stats (teljes szélesség) */}
                        <div>
                            <TodoStats />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
