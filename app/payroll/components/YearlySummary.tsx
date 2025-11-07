"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

interface MonthData {
    month: number;
    monthName: string;
    hours: number;
    grossAmount: number;
}

interface YearlyData {
    year: number;
    hourlyRate: number;
    monthlyData: MonthData[];
    yearlyTotal: {
        hours: number;
        grossAmount: number;
    };
}

const YearlySummary: React.FC = () => {
    const { language } = useLanguage();
    const [data, setData] = useState<YearlyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const fetchYearlyData = async (year: number) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/payroll/yearly?year=${year}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching yearly payroll:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchYearlyData(currentYear);
    }, [currentYear]);

    const translations = {
        en: {
            title: "Yearly Pay Summary",
            yearlyTotal: "YEARLY TOTAL",
            loading: "Loading...",
            soFar: "(so far)",
        },
        hu: {
            title: "Éves Bérek Összesítő",
            yearlyTotal: "ÉVES ÖSSZESEN",
            loading: "Betöltés...",
            soFar: "(eddig)",
        }
    };

    const t = translations[language];

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

    const goToPreviousYear = () => {
        setCurrentYear(currentYear - 1);
    };

    const goToNextYear = () => {
        setCurrentYear(currentYear + 1);
    };

    const isCurrentMonth = (month: number) => {
        const now = new Date();
        return currentYear === now.getFullYear() && month === now.getMonth() + 1;
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header with Year Navigation */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToPreviousYear}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <HiChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="text-lg font-semibold text-gray-700 min-w-[100px] text-center">
                        {currentYear}
                    </span>
                    <button
                        onClick={goToNextYear}
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
            ) : data ? (
                <div>
                    {/* Monthly Data */}
                    <div className="space-y-2 mb-6">
                        {data.monthlyData.map((monthData) => (
                            <div
                                key={monthData.month}
                                className={`flex justify-between items-center py-3 px-4 rounded-lg border ${
                                    monthData.hours > 0 ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                                }`}
                            >
                                <span className="text-sm font-medium text-gray-700 w-32">
                                    {monthNames[language][monthData.month - 1]}
                                    {isCurrentMonth(monthData.month) && (
                                        <span className="ml-2 text-xs text-nexus-tertiary">{t.soFar}</span>
                                    )}
                                </span>
                                <span className="text-sm text-gray-800">
                                    {monthData.hours > 0 ? `${monthData.hours}h` : '-'}
                                </span>
                                <span className="text-sm font-semibold text-gray-900 w-40 text-right">
                                    {monthData.grossAmount > 0 ? `${formatCurrency(monthData.grossAmount)} Ft` : '-'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Yearly Total */}
                    <div className="bg-gradient-to-r from-nexus-primary to-nexus-secondary rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-white">{t.yearlyTotal}</span>
                            <span className="text-lg font-bold text-white">
                                {data.yearlyTotal.hours}h → {formatCurrency(data.yearlyTotal.grossAmount)} Ft
                            </span>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default YearlySummary;
