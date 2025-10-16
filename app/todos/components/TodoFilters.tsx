"use client";

import { useState, useEffect } from "react";
import { User } from "@prisma/client";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";

interface TodoFiltersProps {
    filters: {
        userId?: string;
        position?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    };
    onFiltersChange: (filters: any) => void;
    isManager: boolean;
}

const TodoFilters: React.FC<TodoFiltersProps> = ({
    filters,
    onFiltersChange,
    isManager
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const { language } = useLanguage();

    const translations = {
        en: {
            filterBy: "Filter by",
            allUsers: "All Users",
            allPositions: "All Positions",
            allStatuses: "All Statuses",
            from: "From",
            to: "To",
            positions: {
                Cashier: "Cashier",
                Kitchen: "Kitchen",
                Storage: "Storage",
                Packer: "Packer"
            },
            statuses: {
                PENDING: "Pending",
                IN_PROGRESS: "In Progress",
                COMPLETED: "Completed",
                OVERDUE: "Overdue"
            }
        },
        hu: {
            filterBy: "Szűrés",
            allUsers: "Minden felhasználó",
            allPositions: "Minden pozíció",
            allStatuses: "Minden státusz",
            from: "Ettől",
            to: "Eddig",
            positions: {
                Cashier: "Pénztáros",
                Kitchen: "Konyha",
                Storage: "Raktár",
                Packer: "Csomagoló"
            },
            statuses: {
                PENDING: "Várakozik",
                IN_PROGRESS: "Folyamatban",
                COMPLETED: "Befejezve",
                OVERDUE: "Lejárt"
            }
        },
    };

    const t = translations[language];

    useEffect(() => {
        if (isManager) {
            const fetchUsers = async () => {
                try {
                    const response = await axios.get('/api/users');
                    setUsers(response.data);
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            };
            fetchUsers();
        }
    }, [isManager]);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = {
            ...filters,
            [key]: value || undefined
        };
        onFiltersChange(newFilters);
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* User Filter - Only for managers */}
                {isManager && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t.allUsers}
                        </label>
                        <select
                            value={filters.userId || ''}
                            onChange={(e) => handleFilterChange('userId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                        >
                            <option value="">{t.allUsers}</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Position Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.allPositions}
                    </label>
                    <select
                        value={filters.position || ''}
                        onChange={(e) => handleFilterChange('position', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                    >
                        <option value="">{t.allPositions}</option>
                        {Object.entries(t.positions).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.allStatuses}
                    </label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                    >
                        <option value="">{t.allStatuses}</option>
                        {Object.entries(t.statuses).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                </div>

                {/* Start Date Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.from}
                    </label>
                    <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                    />
                </div>

                {/* End Date Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.to}
                    </label>
                    <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                    />
                </div>
            </div>
        </div>
    );
};