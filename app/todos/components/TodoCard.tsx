"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, TodoStatus, TodoPriority } from "@prisma/client";
import { useLanguage } from "@/app/context/LanguageContext";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import axios from "axios";
import { toast } from "react-hot-toast";
import NotesEditor from "./NotesEditor";
import {
    HiCalendar,
    HiUser,
    HiClock,
    HiExclamationTriangle,
    HiCheckCircle,
    HiPlayCircle,
    HiPauseCircle,
    HiChevronDown,
    HiChevronUp
} from "react-icons/hi2";

interface TodoWithRelations {
    id: string;
    title: string;
    description: string | null;
    priority: TodoPriority;
    status: TodoStatus;
    startDate: Date | null;
    dueDate: Date | null;
    targetPosition: string | null;
    assignedUserId: string;
    notes: string | null;
    assignedUser: {
        id: string;
        name: string;
        email: string;
    };
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
}

interface TodoCardProps {
    todo: TodoWithRelations;
    onUpdate: (todo: TodoWithRelations) => void;
    currentUser: User;
}

const TodoCard: React.FC<TodoCardProps> = ({
    todo,
    onUpdate,
    currentUser
}) => {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { language } = useLanguage();

    const translations = {
        en: {
            assignedTo: "Assigned to",
            createdBy: "Created by",
            dueDate: "Due date",
            startDate: "Start date",
            priority: "Priority",
            status: "Status",
            notes: "Notes",
            markCompleted: "Mark as Completed",
            markInProgress: "Mark as In Progress",
            markPending: "Mark as Pending",
            addNote: "Add note...",
            saveNote: "Save Note",
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
            },
            positions: {
                Cashier: "Cashier",
                Kitchen: "Kitchen",
                Storage: "Storage",
                Packer: "Packer"
            }
        },
        hu: {
            assignedTo: "Hozzárendelve",
            createdBy: "Létrehozta",
            dueDate: "Határidő",
            startDate: "Kezdés",
            priority: "Prioritás",
            status: "Státusz",
            notes: "Megjegyzések",
            markCompleted: "Befejezettnek jelölés",
            markInProgress: "Folyamatban jelölés",
            markPending: "Várakozónak jelölés",
            addNote: "Megjegyzés hozzáadása...",
            saveNote: "Megjegyzés mentése",
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
            },
            positions: {
                Cashier: "Pénztáros",
                Kitchen: "Konyha",
                Storage: "Raktár",
                Packer: "Csomagoló"
            }
        },
    };

    const t = translations[language];
    const locale = language === 'hu' ? hu : enUS;

    const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);
    const isOwner = todo.assignedUserId === currentUser.id;
    const canUpdate = isManager || isOwner;

    const getPriorityColor = (priority: TodoPriority) => {
        switch (priority) {
            case 'LOW': return 'bg-blue-100 text-blue-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'URGENT': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: TodoStatus) => {
        switch (status) {
            case 'PENDING': return 'bg-gray-100 text-gray-800';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'OVERDUE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: TodoStatus) => {
        switch (status) {
            case 'PENDING': return <HiPauseCircle className="h-4 w-4" />;
            case 'IN_PROGRESS': return <HiPlayCircle className="h-4 w-4" />;
            case 'COMPLETED': return <HiCheckCircle className="h-4 w-4" />;
            case 'OVERDUE': return <HiExclamationTriangle className="h-4 w-4" />;
            default: return <HiClock className="h-4 w-4" />;
        }
    };

    const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && todo.status !== 'COMPLETED';

    const handleStatusUpdate = async (newStatus: TodoStatus) => {
        if (!canUpdate) return;

        setIsUpdating(true);
        try {
            const response = await axios.patch(`/api/todos/${todo.id}`, {
                status: newStatus,
                completedAt: newStatus === 'COMPLETED' ? new Date() : null
            });

            onUpdate(response.data);
            toast.success('Status updated successfully');

            // Refresh the page to show updated TODO (same as User/Schedule updates)
            router.refresh();
        } catch (error) {
            console.error('Error updating todo status:', error);
            toast.error('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleNotesUpdate = async (notes: string) => {
        if (!canUpdate) return;

        try {
            const response = await axios.patch(`/api/todos/${todo.id}`, { notes });
            onUpdate(response.data);
            toast.success('Notes updated successfully');

            // Refresh the page to show updated TODO
            router.refresh();
        } catch (error) {
            console.error('Error updating notes:', error);
            toast.error('Failed to update notes');
        }
    };

    return (
        <div className={`bg-white rounded-lg border shadow-sm ${isOverdue ? 'border-red-300' : 'border-gray-200'}`}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {todo.title}
                        </h3>
                        {todo.description && (
                            <p className="text-gray-600 text-sm">{todo.description}</p>
                        )}
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="ml-2 p-1 hover:bg-gray-100 rounded"
                    >
                        {isExpanded ? (
                            <HiChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                            <HiChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                </div>

                {/* Quick Info Row */}
                <div className="flex items-center gap-4 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                        {t.priorities[todo.priority]}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isOverdue ? 'OVERDUE' : todo.status)}`}>
                        {getStatusIcon(isOverdue ? 'OVERDUE' : todo.status)}
                        {t.statuses[isOverdue ? 'OVERDUE' : todo.status]}
                    </span>
                    {todo.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <HiCalendar className="h-4 w-4" />
                            {format(new Date(todo.dueDate), 'MMM dd, yyyy', { locale })}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {canUpdate && !isUpdating && (
                    <div className="flex gap-2 mb-3">
                        {todo.status !== 'COMPLETED' && (
                            <button
                                onClick={() => handleStatusUpdate('COMPLETED')}
                                className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200 transition-colors"
                            >
                                {t.markCompleted}
                            </button>
                        )}
                        {todo.status !== 'IN_PROGRESS' && todo.status !== 'COMPLETED' && (
                            <button
                                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 transition-colors"
                            >
                                {t.markInProgress}
                            </button>
                        )}
                        {todo.status !== 'PENDING' && todo.status !== 'COMPLETED' && (
                            <button
                                onClick={() => handleStatusUpdate('PENDING')}
                                className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200 transition-colors"
                            >
                                {t.markPending}
                            </button>
                        )}
                    </div>
                )}

                {isUpdating && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-nexus-tertiary"></div>
                        <span className="text-sm text-gray-600">Updating...</span>
                    </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="border-t pt-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <HiUser className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{t.assignedTo}:</span>
                                <span className="text-sm font-medium">
                                    {todo.assignedUser.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <HiUser className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{t.createdBy}:</span>
                                <span className="text-sm font-medium">{todo.createdBy.name}</span>
                            </div>

                            {todo.startDate && (
                                <div className="flex items-center gap-2">
                                    <HiCalendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{t.startDate}:</span>
                                    <span className="text-sm">
                                        {format(new Date(todo.startDate), 'MMM dd, yyyy', { locale })}
                                    </span>
                                </div>
                            )}

                            {todo.dueDate && (
                                <div className="flex items-center gap-2">
                                    <HiCalendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{t.dueDate}:</span>
                                    <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                        {format(new Date(todo.dueDate), 'MMM dd, yyyy', { locale })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Notes Section */}
                        {canUpdate ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.notes}
                                </label>
                                <NotesEditor
                                    initialNotes={todo.notes || ''}
                                    onSave={handleNotesUpdate}
                                    placeholder={t.addNote}
                                />
                            </div>
                        ) : todo.notes && (
                            <div>
                                <span className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.notes}
                                </span>
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    {todo.notes}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};