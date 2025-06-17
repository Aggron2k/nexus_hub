// app/todos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/context/LanguageContext";
import { User } from "@prisma/client";
import { HiPlus, HiClipboardDocumentList } from "react-icons/hi2";

const TodosPage = () => {
    const [loading, setLoading] = useState(true);

    const { data: session } = useSession();
    const currentUser = session?.user as User | null;
    const { language } = useLanguage();

    const translations = {
        en: {
            todos: "Todo Management",
            comingSoon: "Coming Soon",
            description: "The TODO management system is currently under development. This will include:",
            features: [
                "Task assignment and tracking",
                "Position-based task filtering",
                "Priority and deadline management",
                "Manager oversight capabilities",
                "Real-time status updates"
            ],
            currentRole: "Your current role",
            permissions: "Your permissions",
            canView: "View your assigned tasks",
            canCreate: "Create and manage tasks for others",
            canFilter: "Filter tasks by user, position, and date",
            employee: "Employee",
            manager: "Manager"
        },
        hu: {
            todos: "Feladat kezelés",
            comingSoon: "Hamarosan",
            description: "A TODO kezelő rendszer jelenleg fejlesztés alatt áll. Ez tartalmazni fogja:",
            features: [
                "Feladat hozzárendelés és követés",
                "Pozíció alapú feladat szűrés",
                "Prioritás és határidő kezelés",
                "Manager felügyeleti funkciók",
                "Valós idejű státusz frissítések"
            ],
            currentRole: "Jelenlegi szerepkör",
            permissions: "Jogosultságok",
            canView: "Saját feladatok megtekintése",
            canCreate: "Feladatok létrehozása és kezelése mások számára",
            canFilter: "Feladatok szűrése felhasználó, pozíció és dátum szerint",
            employee: "Alkalmazott",
            manager: "Manager"
        },
    };

    const t = translations[language];

    const isManager = currentUser && ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (!currentUser) {
        return (
            <div className="lg:pl-80 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-tertiary"></div>
            </div>
        );
    }

    return (
        <div className="lg:pl-80 h-full">
            <div className="h-full flex flex-col bg-nexus-bg">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-nexus-primary rounded-lg">
                                <HiClipboardDocumentList className="h-6 w-6 text-nexus-tertiary" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">{t.todos}</h1>
                        </div>
                        {isManager && (
                            <button
                                disabled
                                className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-60"
                            >
                                <HiPlus className="h-5 w-5" />
                                Create Todo
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-tertiary"></div>
                            <span className="ml-3 text-gray-600">Loading...</span>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            {/* Coming Soon Card */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center mb-8">
                                <div className="p-4 bg-nexus-primary rounded-full w-fit mx-auto mb-6">
                                    <HiClipboardDocumentList className="h-12 w-12 text-nexus-tertiary" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.comingSoon}</h2>
                                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                                    {t.description}
                                </p>

                                {/* Features List */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    {t.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3 text-left">
                                            <div className="w-2 h-2 bg-nexus-tertiary rounded-full flex-shrink-0"></div>
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* User Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Role Card */}
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.currentRole}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${isManager
                                                ? 'bg-nexus-primary text-nexus-tertiary'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {currentUser.role}
                                        </span>
                                        {currentUser.position && (
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                {currentUser.position}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Permissions Card */}
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.permissions}</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-sm text-gray-700">{t.canView}</span>
                                        </div>
                                        {isManager && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="text-sm text-gray-700">{t.canCreate}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="text-sm text-gray-700">{t.canFilter}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Development Status */}
                            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-blue-800 font-medium">Development Status</span>
                                </div>
                                <p className="text-blue-700 text-sm mt-2">
                                    The TODO management system is being developed with dynamic position management,
                                    role-based permissions, and real-time updates. Check back soon for updates!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TodosPage;