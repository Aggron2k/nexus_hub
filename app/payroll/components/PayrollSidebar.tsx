"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { HiCurrencyDollar, HiUserGroup, HiUser } from "react-icons/hi2";
import Image from "next/image";
import axios from "axios";

interface PayrollSidebarProps {
    currentUser: User | null;
}

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

const PayrollSidebar: React.FC<PayrollSidebarProps> = ({ currentUser }) => {
    const { language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const [summary, setSummary] = useState<PayrollSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = currentUser?.role === "GeneralManager" || currentUser?.role === "CEO";
    const isOnAdminPage = pathname === "/payroll/admin";

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
            title: "Payroll",
            currentMonth: "Current Month",
            hoursWorked: "Hours Worked",
            hourlyRate: "Hourly Rate",
            grossAmount: "Gross Amount",
            progress: "Progress",
            daysLeft: "Days Left",
            loading: "Loading...",
            myPayroll: "My Payroll",
            teamPayroll: "Team Payroll",
        },
        hu: {
            title: "Bérezés",
            currentMonth: "Aktuális Hónap",
            hoursWorked: "Ledolgozott Órák",
            hourlyRate: "Órabér",
            grossAmount: "Bruttó Összeg",
            progress: "Haladás",
            daysLeft: "Hátralévő Napok",
            loading: "Betöltés...",
            myPayroll: "Saját Bérem",
            teamPayroll: "Csapat Bérezés",
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
                            <HiCurrencyDollar className="h-6 w-6 text-nexus-tertiary" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-800">
                            {t.title}
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons - Admin Only */}
                {isAdmin && (
                    <div className="mb-4 flex flex-col gap-2">
                        <button
                            onClick={() => router.push('/payroll')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                !isOnAdminPage
                                    ? 'bg-nexus-tertiary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <HiUser className="h-5 w-5" />
                            <span className="font-medium">{t.myPayroll}</span>
                        </button>
                        <button
                            onClick={() => router.push('/payroll/admin')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                isOnAdminPage
                                    ? 'bg-nexus-tertiary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <HiUserGroup className="h-5 w-5" />
                            <span className="font-medium">{t.teamPayroll}</span>
                        </button>
                    </div>
                )}

                {/* Payroll Summary Widget */}
                {isLoading ? (
                    <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500">{t.loading}</p>
                    </div>
                ) : summary && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-nexus-primary to-nexus-secondary rounded-lg shadow-md">
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
                )}
            </div>
        </aside>
    );
};

export default PayrollSidebar;
