// app/todos/components/TodoBox.tsx
"use client";

import clsx from "clsx";
import { User } from "@prisma/client";
import { format, isPast } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiClock, HiExclamationTriangle } from "react-icons/hi2";

interface TodoWithRelations {
    id: string;
    title: string;
    description: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
    startDate: Date | null;
    dueDate: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    assignedUser: {
        id: string;
        name: string;
        email: string;
        role: string;
        positionId: string | null;
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

interface TodoBoxProps {
    todo: TodoWithRelations;
    isSelected: boolean;
    onUpdate: (todo: TodoWithRelations) => void;
    currentUser: User | null;
}

const TodoBox: React.FC<TodoBoxProps> = ({
    todo,
    isSelected,
    onUpdate,
    currentUser
}) => {
    const { language } = useLanguage();

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

    const priorityLabels = {
        en: {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            URGENT: "Urgent"
        },
        hu: {
            LOW: "Alacsony",
            MEDIUM: "Közepes",
            HIGH: "Magas",
            URGENT: "Sürgős"
        }
    };

    const statusLabels = {
        en: {
            PENDING: "Pending",
            IN_PROGRESS: "In Progress",
            COMPLETED: "Completed",
            OVERDUE: "Overdue"
        },
        hu: {
            PENDING: "Várakozik",
            IN_PROGRESS: "Folyamatban",
            COMPLETED: "Befejezve",
            OVERDUE: "Lejárt"
        }
    };

    const isOverdue = todo.dueDate && isPast(new Date(todo.dueDate)) && todo.status !== 'COMPLETED';
    const locale = language === 'hu' ? hu : enUS;

    return (
        <div className={clsx(
            "relative flex items-start space-x-3 bg-white p-3 rounded-lg transition cursor-pointer border",
            isSelected
                ? "border-nexus-tertiary bg-nexus-primary/10"
                : "border-gray-200 hover:border-nexus-secondary hover:bg-gray-50"
        )}>
            {/* Priority Indicator */}
            <div className={clsx(
                "w-1 h-16 rounded-full flex-shrink-0",
                todo.priority === "URGENT" ? "bg-red-500" :
                    todo.priority === "HIGH" ? "bg-yellow-500" :
                        todo.priority === "MEDIUM" ? "bg-blue-500" : "bg-gray-400"
            )} />

            <div className="min-w-0 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {todo.title}
                    </p>
                    {isOverdue && (
                        <HiExclamationTriangle className="h-4 w-4 text-red-500 flex-shrink-0 ml-1" />
                    )}
                </div>

                {/* Description */}
                {todo.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {todo.description}
                    </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                    <span className={clsx(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                        priorityColors[todo.priority]
                    )}>
                        {priorityLabels[language][todo.priority]}
                    </span>

                    <span className={clsx(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                        statusColors[todo.status]
                    )}>
                        {statusLabels[language][todo.status]}
                    </span>

                    {todo.targetPosition && (
                        <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: todo.targetPosition.color }}
                        >
                            {todo.targetPosition.displayName}
                        </span>
                    )}
                </div>

                {/* Due Date */}
                {todo.dueDate && (
                    <div className={clsx(
                        "flex items-center gap-1 text-xs",
                        isOverdue ? "text-red-600" : "text-gray-500"
                    )}>
                        <HiClock className="h-3 w-3" />
                        <span>
                            {format(new Date(todo.dueDate), "MMM d, HH:mm", { locale })}
                        </span>
                    </div>
                )}

                {/* Assigned User */}
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                        {todo.assignedUser.name}
                    </span>
                    {todo.assignedUser.position && (
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: todo.assignedUser.position.color }}
                            title={todo.assignedUser.position.displayName}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TodoBox;