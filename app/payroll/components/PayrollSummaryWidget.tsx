"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiCurrencyDollar } from "react-icons/hi2";
import axios from "axios";

interface PayrollSummary {
    month: number;
    year: number;
    totalHoursWorked: number;
    expectedMonthlyHours: number;
    hourlyRate: number;
    grossAmount: number;
    progressPercentage: number;
    daysRemaining: number;
}

const PayrollSummaryWidget: React.FC = () => {
    const { language } = useLanguage();
    const [summary, setSummary] = useState<PayrollSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await axios.get('/api/payroll/summary');
                setSummary(response.data);
            } catch (error) {
                console.error('Error fetching payroll summary:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
    }, []);

    const translations = {
        en: {
            currentMonth: "Current Month",
            hoursWorked: "Hours Worked",
            hourlyRate: "Hourly Rate",
            grossAmount: "Gross Amount",
            progress: "Progress",
            daysLeft: "Days Left",
            loading: "Loading...",
        },
        hu: {
            currentMonth: "Aktuális Hónap",
            hoursWorked: "Ledolgozott Órák",
            hourlyRate: "Órabér",
            grossAmount: "Bruttó Összeg",
            progress: "Haladás",
            daysLeft: "Hátralévő Napok",
            loading: "Betöltés...",
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

    if (isLoading) {
        return (
            <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">{t.loading}</p>
            </div>
        );
    }

    if (!summary) {
        return null;
    }

    return (
        <div className="p-4 p-4 bg-gradient-to-br from-nexus-primary to-nexus-secondary rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-3">
                <HiCurrencyDollar className="h-5 w-5 text-white" />
                <h3 className="text-sm font-semibold text-white">
                    {t.currentMonth} - {monthNames[language][summary.month - 1]} {summary.year}
                </h3>
            </div>

            {/* Hours Worked */}
            <div className="mb-3">
                <p className="text-xs text-white/80">{t.hoursWorked}</p>
                <p className="text-lg font-bold text-white">
                    {summary.totalHoursWorked}h / {summary.expectedMonthlyHours}h
                </p>
            </div>

            {/* Hourly Rate */}
            <div className="mb-3">
                <p className="text-xs text-white/80">{t.hourlyRate}</p>
                <p className="text-md font-semibold text-white">
                    {formatCurrency(summary.hourlyRate)} Ft/h
                </p>
            </div>

            {/* Divider */}
            <div className="border-t border-white/30 my-3"></div>

            {/* Gross Amount */}
            <div className="mb-3">
                <p className="text-xs text-white/80">{t.grossAmount}</p>
                <p className="text-2xl font-bold text-white">
                    {formatCurrency(summary.grossAmount)} Ft
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                    <span>{t.progress}</span>
                    <span>{summary.progressPercentage}%</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2">
                    <div
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(summary.progressPercentage, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Days Left */}
            <div className="mt-3 text-center">
                <p className="text-xs text-white/80">
                    {t.daysLeft}: <span className="font-semibold text-white">{summary.daysRemaining} {language === 'hu' ? 'nap' : 'days'}</span>
                </p>
            </div>
        </div>
    );
};

export default PayrollSummaryWidget;
