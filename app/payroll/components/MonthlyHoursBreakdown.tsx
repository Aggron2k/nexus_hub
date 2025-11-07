"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

interface WeekDay {
    date: string;
    dayOfWeek: number;
    hours: number;
    grossAmount: number;
}

interface Week {
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
    days: WeekDay[];
    totalHours: number;
    totalGrossAmount: number;
}

interface MonthlyData {
    year: number;
    month: number;
    hourlyRate: number;
    weeklyData: Week[];
    monthlyTotal: {
        hours: number;
        grossAmount: number;
    };
}

const MonthlyHoursBreakdown: React.FC = () => {
    const { language } = useLanguage();
    const [data, setData] = useState<MonthlyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchMonthlyData = async (year: number, month: number) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/payroll/monthly?year=${year}&month=${month}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching monthly payroll:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyData(currentDate.getFullYear(), currentDate.getMonth() + 1);
    }, [currentDate]);

    const translations = {
        en: {
            title: "Monthly Hours & Pay Breakdown",
            week: "Week",
            monday: "Monday",
            tuesday: "Tuesday",
            wednesday: "Wednesday",
            thursday: "Thursday",
            friday: "Friday",
            saturday: "Saturday",
            sunday: "Sunday",
            weeklyTotal: "Weekly Total",
            monthlyTotal: "MONTHLY TOTAL",
            loading: "Loading...",
            noData: "No data available for this month.",
        },
        hu: {
            title: "Havi Órák & Bérek Részletezése",
            week: "Hét",
            monday: "Hétfő",
            tuesday: "Kedd",
            wednesday: "Szerda",
            thursday: "Csütörtök",
            friday: "Péntek",
            saturday: "Szombat",
            sunday: "Vasárnap",
            weeklyTotal: "Heti Összesen",
            monthlyTotal: "HAVI ÖSSZESEN",
            loading: "Betöltés...",
            noData: "Nincs adat ehhez a hónaphoz.",
        }
    };

    const t = translations[language];

    const dayNames = [t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday];

    const monthNames = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        hu: ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December']
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${monthNames[language][date.getMonth()]} ${date.getDate()}`;
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header with Month Navigation */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <HiChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="text-lg font-semibold text-gray-700 min-w-[200px] text-center">
                        {monthNames[language][currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <HiChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">{t.loading}</p>
                </div>
            ) : data && data.weeklyData.length > 0 ? (
                <div className="space-y-6">
                    {/* Weekly Breakdown */}
                    {data.weeklyData.map((week) => (
                        <div key={week.weekNumber} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">
                                {t.week} {week.weekNumber} ({formatDate(week.weekStart)} - {formatDate(week.weekEnd)})
                            </h3>
                            <div className="space-y-2">
                                {week.days.map((day, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-sm font-medium text-gray-600 w-32">
                                            {dayNames[index]} ({new Date(day.date).getDate()})
                                        </span>
                                        <span className="text-sm text-gray-800">
                                            {day.hours > 0 ? `${day.hours}h` : '-'}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900 w-32 text-right">
                                            {day.grossAmount > 0 ? `${formatCurrency(day.grossAmount)} Ft` : '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t-2 border-gray-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-md font-bold text-gray-700">{t.weeklyTotal}</span>
                                    <span className="text-md font-bold text-gray-900">
                                        {week.totalHours}h → {formatCurrency(week.totalGrossAmount)} Ft
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Monthly Total */}
                    <div className="bg-nexus-primary rounded-lg p-4 mt-6">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-white">{t.monthlyTotal}</span>
                            <span className="text-lg font-bold text-white">
                                {data.monthlyTotal.hours}h → {formatCurrency(data.monthlyTotal.grossAmount)} Ft
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500">{t.noData}</p>
                </div>
            )}
        </div>
    );
};

export default MonthlyHoursBreakdown;
