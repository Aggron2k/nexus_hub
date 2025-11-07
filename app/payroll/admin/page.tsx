"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import EmployeePayrollTable from "../components/EmployeePayrollTable";

export default function PayrollAdminPage() {
    const { language } = useLanguage();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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
        },
        hu: {
            loading: "Betöltés...",
            unauthorized: "Jogosulatlan hozzáférés",
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

    if (!currentUser || (currentUser.role !== "GeneralManager" && currentUser.role !== "CEO")) {
        return (
            <div className="hidden lg:block lg:pl-80 h-full">
                <div className="h-full flex items-center justify-center bg-nexus-bg">
                    <p className="text-red-500">{t.unauthorized}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="hidden lg:block lg:pl-80 h-full">
            <div className="h-full bg-nexus-bg p-6 overflow-y-auto">
                <EmployeePayrollTable />
            </div>
        </div>
    );
}
