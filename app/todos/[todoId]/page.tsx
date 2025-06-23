// app/todos/[todoId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import {
    HiClipboardDocumentList,
    HiClock,
    HiUser,
    HiTag,
    HiExclamationTriangle,
    HiCheckCircle,
    HiPlayCircle
} from "react-icons/hi2";
import LoadingModal from "@/app/components/LoadingModal";

interface TodoDetail {
    id: string;
    title: string;
    description: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
    startDate: string | null;
    dueDate: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    notes: string | null;
    assignedUser: {
        id: string;
        name: string;
        email: string;
        role: string;
        position: {
            id: string;
            name: string;
            displayName: string;
            color: string;
        } | null;
    };
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    targetPosition: {
        id: string;
        name: string;
        displayName: string;
        color: string;
    } | null;
}

const TodoDetailPage = () => {
    const { todoId } = useParams() as { todoId: string };
    const [todo, setTodo] = useState<TodoDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { language } = useLanguage();

    const translations = {
        en: {
            todoDetails: "Todo Details",
            description: "Description",
            priority: "Priority",
            status: "Status",
            assignedTo: "Assigned to",
            targetPosition: "Target Position",
            startDate: "Start Date",
            dueDate: "Due Date",
            completedAt: "Completed At",
            createdBy: "Created by",
            createdAt: "Created At",
            notes: "Notes",
            noDescription: "No description provided",
            noNotes: "No notes added",
            markInProgress: "Mark In Progress",
            markCompleted: "Mark Completed",
            failedToLoad: "Failed to load todo details",
            priorities: {
                LOW: "Low",
                MEDIUM: "Medium",
                HIGH: "High",
                URGENT: "Urgent"
            },
            statuses: {
                PENDING: "Pending",
                IN_PROGRESS: "In Progress",
                COMPLETED: "Completed",
                OVERDUE: "Overdue"
            }
        },
        hu: {
            todoDetails: "Feladat részletei",
            description: "Leírás",
            priority: "Prioritás",
            status: "Státusz",
            assignedTo: "Hozzárendelve",
            targetPosition: "Célpozíció",
            startDate: "Kezdés dátuma",
            dueDate: "Határidő",
            completedAt: "Befejezve",
            createdBy: "Létrehozta",
            createdAt: "Létrehozva",
            notes: "Megjegyzések",
            noDescription: "Nincs leírás megadva",
            noNotes: "Nincsenek megjegyzések",
            markInProgress: "Folyamatban jelölés",
            markCompleted: "Befejezett jelölés",
            failedToLoad: "A feladat részleteinek betöltése sikertelen",
            priorities: {
                LOW: "Alacsony",
                MEDIUM: "Közepes",
                HIGH: "Magas",
                URGENT: "Sürgős"
            },
            statuses: {
                PENDING: "Várakozik",
                IN_PROGRESS: "Folyamatban",
                COMPLETED: "Befejezve",
                OVERDUE: "Lejárt"
            }
        }
    };

    const t = translations[language];
    const locale = language === 'hu' ? hu : enUS;

    useEffect(() => {
        if (!todoId) {
            setError("Todo ID is required");
            setLoading(false);
            return;
        }

        fetchTodoDetails();
    }, [todoId]);

    const fetchTodoDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/todos/${todoId}`);
            setTodo(response.data);
        } catch (error) {
            console.error("Error fetching todo details:", error);
            setError(t.failedToLoad);
            toast.error(t.failedToLoad);
        } finally {
            setLoading(false);
        }
    };

    const updateTodoStatus = async (newStatus: string) => {
        try {
            await axios.patch(`/api/todos/${todoId}`, {
                status: newStatus,
                completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
            });

            toast.success("Status updated successfully!");
            fetchTodoDetails(); // Refresh data
        } catch (error) {
            console.error("Error updating todo status:", error);
            toast.error("Failed to update status");
        }
    };

    if (loading) return <LoadingModal />;
    if (error || !todo) {
        return (
            <div className="lg:pl-80 h-full">
                <div className="h-full flex items-center justify-center">
                    <p className="text-red-500">{error || "Todo not found"}</p>
                </div>
            </div>
        );
    }

    const priorityColors = {
        LOW: "bg-gray-100 text-gray-800",
        MEDIUM: "bg-blue-100 text-blue-800",
        HIGH: "bg-yellow-100 text-yellow-800",
        URGENT: "bg-red-100 text-red-800"
    };

    const statusColors = {
        PENDING: "bg-gray-100 text-gray-800",
        IN_PROGRESS: "bg-blue-100 text-blue-800",
        COMPLETED: "bg-green-100 text-green-800",
        OVERDUE: "bg-red-100 text-red-800"
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
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{t.todoDetails}</h1>
                                <p className="text-sm text-gray-600">{todo.title}</p>
                            </div>
                        </div>

                        {/* Status Action Buttons */}
                        <div className="flex gap-2">
                            {todo.status === 'PENDING' && (
                                <button
                                    onClick={() => updateTodoStatus('IN_PROGRESS')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <HiPlayCircle className="h-4 w-4" />
                                    {t.markInProgress}
                                </button>
                            )}
                            {(todo.status === 'PENDING' || todo.status === 'IN_PROGRESS') && (
                                <button
                                    onClick={() => updateTodoStatus('COMPLETED')}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <HiCheckCircle className="h-4 w-4" />
                                    {t.markCompleted}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Description */}
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">{t.description}</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {todo.description || t.noDescription}
                                    </p>
                                </div>

                                {/* Priority */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t.priority}</h4>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[todo.priority]}`}>
                                        {t.priorities[todo.priority]}
                                    </span>
                                </div>

                                {/* Status */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t.status}</h4>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[todo.status]}`}>
                                        {t.statuses[todo.status]}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Assignment & Position Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Assigned User */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                        <HiUser className="h-4 w-4" />
                                        {t.assignedTo}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{todo.assignedUser.name}</p>
                                            <p className="text-sm text-gray-500">{todo.assignedUser.email}</p>
                                        </div>
                                        {todo.assignedUser.position && (
                                            <span
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: todo.assignedUser.position.color }}
                                                title={todo.assignedUser.position.displayName}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Target Position */}
                                {todo.targetPosition && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                            <HiTag className="h-4 w-4" />
                                            {t.targetPosition}
                                        </h4>
                                        <span
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                                            style={{ backgroundColor: todo.targetPosition.color }}
                                        >
                                            {todo.targetPosition.displayName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Start Date */}
                                {todo.startDate && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                            <HiClock className="h-4 w-4" />
                                            {t.startDate}
                                        </h4>
                                        <p className="text-gray-900">
                                            {format(new Date(todo.startDate), "MMM d, yyyy HH:mm", { locale })}
                                        </p>
                                    </div>
                                )}

                                {/* Due Date */}
                                {todo.dueDate && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                            <HiExclamationTriangle className="h-4 w-4" />
                                            {t.dueDate}
                                        </h4>
                                        <p className={`font-medium ${new Date(todo.dueDate) < new Date() && todo.status !== 'COMPLETED'
                                            ? 'text-red-600' : 'text-gray-900'
                                            }`}>
                                            {format(new Date(todo.dueDate), "MMM d, yyyy HH:mm", { locale })}
                                        </p>
                                    </div>
                                )}

                                {/* Completed At */}
                                {todo.completedAt && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                            <HiCheckCircle className="h-4 w-4" />
                                            {t.completedAt}
                                        </h4>
                                        <p className="text-green-600 font-medium">
                                            {format(new Date(todo.completedAt), "MMM d, yyyy HH:mm", { locale })}
                                        </p>
                                    </div>
                                )}

                                {/* Created At */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t.createdAt}</h4>
                                    <p className="text-gray-900">
                                        {format(new Date(todo.createdAt), "MMM d, yyyy HH:mm", { locale })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes Card */}
                        {todo.notes && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">{t.notes}</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {todo.notes || t.noNotes}
                                </p>
                            </div>
                        )}

                        {/* Created By Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">{t.createdBy}</h3>
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="font-medium text-gray-900">{todo.createdBy.name}</p>
                                    <p className="text-sm text-gray-500">{todo.createdBy.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodoDetailPage;