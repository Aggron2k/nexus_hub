"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import EmployeePayrollTable from "../components/EmployeePayrollTable";
import PayrollMobileSelector from "../components/PayrollMobileSelector";
import PayrollMobileHeader from "../components/PayrollMobileHeader";

export default function PayrollAdminPage() {
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

                // Csak GM és CEO férhet hozzá
                if (userResponse.data.role !== "GeneralManager" && userResponse.data.role !== "CEO") {
                    router.push('/payroll');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                router.push('/payroll');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const translations = {
        en: {
            loading: "Loading...",
            unauthorized: "Unauthorized access",
            teamPayroll: "Team Payroll",
        },
        hu: {
            loading: "Betöltés...",
            unauthorized: "Jogosulatlan hozzáférés",
            teamPayroll: "Csapat Bérezés",
        }
    };

    const t = translations[language];

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

    if (!currentUser || (currentUser.role !== "GeneralManager" && currentUser.role !== "CEO")) {
        return (
            <>
                {/* Mobile Unauthorized */}
                <div className="block lg:hidden h-full">
                    <div className="h-full flex items-center justify-center bg-nexus-bg">
                        <p className="text-red-500">{t.unauthorized}</p>
                    </div>
                </div>

                {/* Desktop Unauthorized */}
                <div className="hidden lg:block lg:pl-80 h-full">
                    <div className="h-full flex items-center justify-center bg-nexus-bg">
                        <p className="text-red-500">{t.unauthorized}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Mobile View */}
            <div className="block lg:hidden h-full">
                {showMobileSelector ? (
                    // Mobile Selector
                    <PayrollMobileSelector
                        onSelectMyPayroll={() => {
                            setShowMobileSelector(false);
                            router.push('/payroll');
                        }}
                        onSelectTeamPayroll={() => setShowMobileSelector(false)}
                    />
                ) : (
                    // Mobile Content
                    <div className="h-full bg-nexus-bg overflow-y-auto pb-20">
                        <PayrollMobileHeader
                            onBack={() => setShowMobileSelector(true)}
                            title={t.teamPayroll}
                        />

                        {/* Team Payroll Table */}
                        <div className="p-4">
                            <EmployeePayrollTable />
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block lg:pl-80 h-full">
                <div className="h-full bg-nexus-bg p-6 overflow-y-auto">
                    <EmployeePayrollTable />
                </div>
            </div>
        </>
    );
}
