"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiClipboardDocumentList, HiExclamationTriangle } from "react-icons/hi2";
import axios from "axios";

interface TodoStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
}

const TodoStats = () => {
    const [stats, setStats] = useState<TodoStats>({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0
    });
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();

    const translations = {
        en: {
            title: "My Tasks",
            total: "Total",
            pending: "Pending",
            inProgress: "In Progress",
            completed: "Completed",
            overdue: "Overdue",
            overdueWarning: "overdue tasks!",
            noOverdue: "All tasks on track"
        },
        hu: {
            title: "Feladataim",
            total: "Összes",
            pending: "Várakozik",
            inProgress: "Folyamatban",
            completed: "Befejezve",
            overdue: "Lejárt",
            overdueWarning: "lejárt feladat!",
            noOverdue: "Minden feladat időben van"
        }
    };

    const t = translations[language];

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/todos');
            const todos = response.data;

            const now = new Date();
            const statsData = {
                total: todos.length,
                pending: todos.filter((todo: any) => todo.status === 'PENDING').length,
                inProgress: todos.filter((todo: any) => todo.status === 'IN_PROGRESS').length,
                completed: todos.filter((todo: any) => todo.status === 'COMPLETED').length,
                overdue: todos.filter((todo: any) =>
                    todo.dueDate &&
                    new Date(todo.dueDate) < now &&
                    todo.status !== 'COMPLETED'
                ).length
            };

            setStats(statsData);
        } catch (error) {
            console.error('Error fetching todo stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="text-center">
                                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-nexus-primary rounded-lg">
                        <HiClipboardDocumentList className="h-5 w-5 text-nexus-tertiary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
                </div>
                <span className="text-sm text-gray-500">
                    {stats.total} {t.total}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pending */}
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-gray-800 mb-1">{stats.pending}</div>
                    <div className="text-xs font-medium text-gray-600 uppercase">{t.pending}</div>
                </div>

                {/* In Progress */}
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-800 mb-1">{stats.inProgress}</div>
                    <div className="text-xs font-medium text-yellow-700 uppercase">{t.inProgress}</div>
                </div>

                {/* Completed */}
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-3xl font-bold text-green-800 mb-1">{stats.completed}</div>
                    <div className="text-xs font-medium text-green-700 uppercase">{t.completed}</div>
                </div>

                {/* Overdue */}
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-3xl font-bold text-red-800 mb-1">{stats.overdue}</div>
                    <div className="text-xs font-medium text-red-700 uppercase">{t.overdue}</div>
                </div>
            </div>
        </div>
    );
};

export default TodoStats;