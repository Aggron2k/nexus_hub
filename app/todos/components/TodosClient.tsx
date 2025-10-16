// app/todos/components/TodosClient.tsx
"use client";

import { useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { User } from "@prisma/client";
import { HiPlus, HiClipboardDocumentList } from "react-icons/hi2";
import CreateTodoModal from "./CreateTodoModal";

// Todo típus definíció (ha nincs még importálva)
interface TodoWithRelations {
    id: string;
    title: string;
    description: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    startDate: Date | null;
    dueDate: Date | null;
    targetPosition: "Cashier" | "Kitchen" | "Storage" | "Packer" | null;
    assignedUser: {
        id: string;
        name: string;
        email: string;
        position: "Cashier" | "Kitchen" | "Storage" | "Packer";
        role: string;
    };
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
}

interface TodosClientProps {
    currentUser: User;
}

const TodosClient: React.FC<TodosClientProps> = ({ currentUser }) => {
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [todos, setTodos] = useState<TodoWithRelations[]>([]);
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
            manager: "Manager",
            createTodo: "Create Todo"
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
            manager: "Manager",
            createTodo: "Feladat létrehozása"
        },
    };

    const t = translations[language];

    const isManager = currentUser && ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

    // Todo létrehozás kezelése
    const handleTodoCreate = () => {
        setShowCreateModal(false);
    };

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
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-nexus-secondary transition-colors"
                            >
                                <HiPlus className="h-5 w-5" />
                                {t.createTodo}
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
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                <div className="text-center mb-8">
                                    <div className="mx-auto w-24 h-24 bg-nexus-primary rounded-full flex items-center justify-center mb-4">
                                        <HiClipboardDocumentList className="h-12 w-12 text-nexus-tertiary" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t.comingSoon}</h2>
                                    <p className="text-gray-600 max-w-2xl mx-auto">{t.description}</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Funkciók:</h3>
                                        <ul className="space-y-2">
                                            {t.features.map((feature, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <div className="w-2 h-2 bg-nexus-tertiary rounded-full mt-2 flex-shrink-0"></div>
                                                    <span className="text-gray-700">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t.currentRole}:</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium text-gray-700">{currentUser.role}</span>
                                                <span className="px-2 py-1 text-xs bg-nexus-primary text-nexus-tertiary rounded-full">
                                                    {isManager ? t.manager : t.employee}
                                                </span>
                                            </div>
                                        </div>

                                        <h4 className="text-md font-medium text-gray-900 mb-2">{t.permissions}:</h4>
                                        <ul className="space-y-1 text-sm text-gray-600">
                                            <li>✓ {t.canView}</li>
                                            {isManager && <li>✓ {t.canCreate}</li>}
                                            <li>✓ {t.canFilter}</li>
                                        </ul>
                                    </div>
                                </div>

                                {isManager && (
                                    <div className="text-center pt-6 border-t border-gray-200">
                                        <p className="text-gray-600 mb-4">
                                            Manager jogosultságokkal rendelkezel. Kipróbálhatod a todo létrehozás funkciót:
                                        </p>
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-nexus-tertiary text-white rounded-lg hover:bg-nexus-secondary transition-colors font-medium"
                                        >
                                            <HiPlus className="h-5 w-5" />
                                            {t.createTodo}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Todo Modal */}
                {isManager && showCreateModal && (
                    <CreateTodoModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onTodoCreate={handleTodoCreate}
                    />
                )}
            </div>
        </div>
    );
};

export default TodosClient;