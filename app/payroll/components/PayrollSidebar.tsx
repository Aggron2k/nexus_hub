"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { HiUserGroup, HiUser } from "react-icons/hi2";
import Image from "next/image";
import PayrollSummaryWidget from "./PayrollSummaryWidget";

interface PayrollSidebarProps {
    currentUser: User | null;
}

const PayrollSidebar: React.FC<PayrollSidebarProps> = ({ currentUser }) => {
    const { language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();

    const isAdmin = currentUser?.role === "GeneralManager" || currentUser?.role === "CEO";
    const isOnAdminPage = pathname === "/payroll/admin";

    const translations = {
        en: {
            title: "Payroll",
            myPayroll: "My Payroll",
            teamPayroll: "Team Payroll",
        },
        hu: {
            title: "Bérezés",
            myPayroll: "Saját Bérem",
            teamPayroll: "Csapat Bérezés",
        }
    };

    const t = translations[language];

    return (
        <aside className="hidden lg:fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200 bg-white">
            <div className="px-5">
                {/* Logo */}
                <div className="flex items-center justify-center py-6">
                    <Image alt="logo" height="80" width="160" className='mx-auto w-auto' src="/images/logo_big.png" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
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
                <PayrollSummaryWidget />
            </div>
        </aside>
    );
};

export default PayrollSidebar;
