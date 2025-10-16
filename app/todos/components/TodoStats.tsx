"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
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
    const [loading, setLoading] = useState(false);
    const { language } = useLanguage();

    const translations = {
        en: {
            totalTodos: "Total Todos",
            pending: "Pending",
            inProgress: "In Progress",
            completed: "Completed",
            overdue: "Overdue"
        },
        hu: {
            totalTodos: "Összes feladat",
            pending: "Várakozik",
            inProgress: "Folyamatban",
            completed: "Befejezve",
            overdue: "Lejárt"
        }
    };

    const t = translations[language];

    const statCards = [
        { label: t.totalTodos, value: stats.total, color: 'bg-blue-100 text-blue-800' },
        { label: t.pending, value: stats.pending, color: 'bg-gray-100 text-gray-800' },
        { label: t.inProgress, value: stats.inProgress, color: 'bg-yellow-100 text-yellow-800' },
        { label: t.completed, value: stats.completed, color: 'bg-green-100 text-green-800' },
        { label: t.overdue, value: stats.overdue, color: 'bg-red-100 text-red-800' }
    ];

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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {statCards.map((card, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                        {card.label}
                    </div>
                    <div className={`text-2xl font-bold px-2 py-1 rounded ${card.color} w-fit`}>
                        {card.value}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TodoStats;