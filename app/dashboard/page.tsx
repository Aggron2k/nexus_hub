"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";
import WelcomeCard from "./components/WelcomeCard";
import HourSummaryWidget from "../components/HourSummaryWidget";
import TodoStats from "../todos/components/TodoStats";
import UserPositionsCard from "./components/UserPositionsCard";
import VacationBalanceCard from "../time-off/components/VacationBalanceCard";

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
            <div className="hidden lg:block lg:pl-80 h-full">
                <div className="h-full flex items-center justify-center bg-nexus-bg">
                    <p className="text-gray-500">{language === 'hu' ? 'Betöltés...' : 'Loading...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="hidden lg:block lg:pl-80 h-full">
            <div className="h-full bg-nexus-bg p-6 overflow-y-auto">
                {/* Grid Layout - 2-3 oszlopos responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Welcome Card - 2 oszlop */}
                    <div className="lg:col-span-2">
                        <WelcomeCard user={currentUser} />
                    </div>

                    {/* Hour Summary Widget - 1 oszlop */}
                    {latestSchedule && (
                        <div className="lg:col-span-2 xl:col-span-1">
                            <HourSummaryWidget
                                weekScheduleId={latestSchedule.id}
                                weekStart={latestSchedule.weekStart}
                                weekEnd={latestSchedule.weekEnd}
                            />
                        </div>
                    )}

                    {/* Vacation Balance Card - 1 oszlop */}
                    <div className="lg:col-span-2 xl:col-span-1">
                        <VacationBalanceCard />
                    </div>

                    {/* Todo Stats - 2 oszlop */}
                    <div className="lg:col-span-2">
                        <TodoStats />
                    </div>

                    {/* User Positions - 1 oszlop */}
                    <div className="lg:col-span-2 xl:col-span-1">
                        <UserPositionsCard user={currentUser} />
                    </div>

                    
                </div>
            </div>
        </div>
    );
}
