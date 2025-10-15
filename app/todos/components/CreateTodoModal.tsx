// app/todos/components/CreateTodoModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { TodoPriority } from "@prisma/client";
import { HiXMark } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-hot-toast";

interface UserWithPosition {
    id: string;
    name: string;
    email: string;
    role: string;
    positionId: string | null;
    position: {
        id: string;
        name: string;
        displayNames: {
            en: string;
            hu: string;
        };
        color: string;
    } | null;
    createdAt: string;
}

interface Position {
    id: string;
    name: string;
    displayNames: {
        en: string;
        hu: string;
    };
    descriptions?: {
        en: string;
        hu: string;
    };
    isActive: boolean;
    color: string;
    order: number;
    _count: {
        users: number;
        todos: number;
    };
}

interface TodoWithRelations {
    id: string;
    title: string;
    description: string | null;
    priority: TodoPriority;
    startDate: Date | null;
    dueDate: Date | null;
    targetPosition: Position | null;
    assignedUser: {
        id: string;
        name: string;
        email: string;
        position: Position;
        role: string;
    };
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
}

interface CreateTodoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTodoCreate: (todos: TodoWithRelations[]) => void;
}

const CreateTodoModal: React.FC<CreateTodoModalProps> = ({
    isOpen,
    onClose,
    onTodoCreate
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TodoPriority>("MEDIUM");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [targetPositionId, setTargetPositionId] = useState<string>("");
    const [assignmentType, setAssignmentType] = useState<"all" | "specific">("specific");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [users, setUsers] = useState<UserWithPosition[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { language } = useLanguage();

    const translations = {
        en: {
            createTodo: "Create Todo",
            title: "Title",
            description: "Description",
            priority: "Priority",
            startDate: "Start Date",
            dueDate: "Due Date",
            targetPosition: "Target Position",
            assignTo: "Assign To",
            assignToAll: "All users with this position",
            assignToSpecific: "Specific users",
            selectUsers: "Select Users",
            notes: "Notes",
            create: "Create Todo",
            cancel: "Cancel",
            creating: "Creating...",
            titleRequired: "Title is required",
            selectPosition: "Select a position",
            selectAtLeastOneUser: "Select at least one user",
            dueDateBeforeStartDate: "Due date cannot be earlier than start date",
            priorities: {
                LOW: "Low",
                MEDIUM: "Medium",
                HIGH: "High",
                URGENT: "Urgent"
            }
        },
        hu: {
            createTodo: "Feladat létrehozása",
            title: "Cím",
            description: "Leírás",
            priority: "Prioritás",
            startDate: "Kezdés dátuma",
            dueDate: "Határidő",
            targetPosition: "Célpozíció",
            assignTo: "Hozzárendelés",
            assignToAll: "Minden felhasználó ezzel a pozícióval",
            assignToSpecific: "Specifikus felhasználók",
            selectUsers: "Felhasználók kiválasztása",
            notes: "Megjegyzések",
            create: "Feladat létrehozása",
            cancel: "Mégse",
            creating: "Létrehozás...",
            titleRequired: "A cím kötelező",
            selectPosition: "Válassz pozíciót",
            selectAtLeastOneUser: "Válassz legalább egy felhasználót",
            dueDateBeforeStartDate: "A határidő nem lehet korábbi, mint a kezdés dátuma",
            priorities: {
                LOW: "Alacsony",
                MEDIUM: "Közepes",
                HIGH: "Magas",
                URGENT: "Sürgős"
            }
        },
    };

    const t = translations[language];

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchPositions();
        }
    }, [isOpen]);

    useEffect(() => {
        if (targetPositionId) {
            const usersWithPosition = users.filter(user => user.positionId === targetPositionId);
            setSelectedUserIds(usersWithPosition.map(user => user.id));
        }
    }, [targetPositionId, users]);

    const getPositionDisplayName = (position: Position) => {
        if (!position || !position.displayNames) {
            return 'N/A';
        }
        return position.displayNames[language] || position.displayNames['hu'] || position.name;
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        }
    };

    const fetchPositions = async () => {
        try {
            const response = await axios.get('/api/positions');
            // Csak aktív pozíciókat jelenítjük meg
            setPositions(response.data.filter((pos: Position) => pos.isActive));
        } catch (error) {
            console.error('Error fetching positions:', error);
            toast.error('Failed to load positions');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error(t.titleRequired);
            return;
        }

        if (assignmentType === "all" && !targetPositionId) {
            toast.error(t.selectPosition);
            return;
        }

        if (assignmentType === "specific" && selectedUserIds.length === 0) {
            toast.error(t.selectAtLeastOneUser);
            return;
        }

        // Validate that due date is not before start date
        if (startDate && dueDate) {
            const start = new Date(startDate);
            const due = new Date(dueDate);
            if (due < start) {
                toast.error(t.dueDateBeforeStartDate);
                return;
            }
        }

        setIsLoading(true);

        try {
            const todoData = {
                title: title.trim(),
                description: description.trim() || null,
                priority,
                startDate: startDate || null,
                dueDate: dueDate || null,
                targetPositionId: targetPositionId || null,
                assignToAll: assignmentType === "all",
                specificUserIds: assignmentType === "specific" ? selectedUserIds : [],
                notes: notes.trim() || null
            };

            const response = await axios.post('/api/todos', todoData);

            onTodoCreate(Array.isArray(response.data) ? response.data : [response.data]);
            toast.success('Todo created successfully!');
            resetForm();
            onClose();
        } catch (error) {
            console.error('Error creating todo:', error);
            toast.error('Failed to create todo');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setStartDate("");
        setDueDate("");
        setTargetPositionId("");
        setAssignmentType("specific");
        setSelectedUserIds([]);
        setNotes("");
    };

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = targetPositionId
        ? users.filter(user => user.positionId === targetPositionId)
        : users;

    const selectedPosition = positions.find(pos => pos.id === targetPositionId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{t.createTodo}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <HiXMark className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            {t.title} *
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            {t.description}
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                        />
                    </div>

                    {/* Priority and Dates Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Priority */}
                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                                {t.priority}
                            </label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TodoPriority)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                            >
                                <option value="LOW">{t.priorities.LOW}</option>
                                <option value="MEDIUM">{t.priorities.MEDIUM}</option>
                                <option value="HIGH">{t.priorities.HIGH}</option>
                                <option value="URGENT">{t.priorities.URGENT}</option>
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                {t.startDate}
                            </label>
                            <input
                                id="startDate"
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                                {t.dueDate}
                            </label>
                            <input
                                id="dueDate"
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={startDate || undefined}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                            />
                        </div>
                    </div>

                    {/* Target Position */}
                    <div>
                        <label htmlFor="targetPosition" className="block text-sm font-medium text-gray-700 mb-2">
                            {t.targetPosition}
                        </label>
                        <select
                            id="targetPosition"
                            value={targetPositionId}
                            onChange={(e) => setTargetPositionId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                        >
                            <option value="">{t.selectPosition}</option>
                            {positions.map(position => (
                                <option key={position.id} value={position.id}>
                                    {getPositionDisplayName(position)}
                                </option>
                            ))}
                        </select>
                        {selectedPosition && (
                            <p className="mt-1 text-sm text-gray-500">
                                {selectedPosition.descriptions?.[language] || selectedPosition.descriptions?.['en'] || ''}
                            </p>
                        )}
                    </div>

                    {/* Assignment Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.assignTo}
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="all"
                                    checked={assignmentType === "all"}
                                    onChange={(e) => setAssignmentType(e.target.value as "all" | "specific")}
                                    className="h-4 w-4 text-nexus-tertiary focus:ring-nexus-secondary border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">{t.assignToAll}</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="specific"
                                    checked={assignmentType === "specific"}
                                    onChange={(e) => setAssignmentType(e.target.value as "all" | "specific")}
                                    className="h-4 w-4 text-nexus-tertiary focus:ring-nexus-secondary border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">{t.assignToSpecific}</span>
                            </label>
                        </div>
                    </div>

                    {/* User Selection */}
                    {assignmentType === "specific" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.selectUsers}
                            </label>
                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                                {filteredUsers.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">
                                        {targetPositionId ? `Nincs felhasználó a kiválasztott pozícióban` : 'Nincs elérhető felhasználó'}
                                    </p>
                                ) : (
                                    filteredUsers.map(user => {
                                        return (
                                            <div key={user.id} className="flex items-center">
                                                <input
                                                    id={`user-${user.id}`}
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onChange={() => handleUserToggle(user.id)}
                                                    className="h-4 w-4 text-nexus-tertiary focus:ring-nexus-secondary border-gray-300 rounded"
                                                />
                                                <label htmlFor={`user-${user.id}`} className="ml-2 text-sm text-gray-700 flex-1 flex items-center justify-between">
                                                    <span>{user.name}</span>
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        {user.position && (
                                                            <div className="flex items-center">  {/* mt-1 eltávolítva */}
                                                                <div
                                                                    className="w-3 h-3 rounded-full mr-2"
                                                                    style={{ backgroundColor: user.position.color }}
                                                                />
                                                                <span className="text-xs text-gray-600">
                                                                    {getPositionDisplayName(user.position)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {selectedUserIds.length > 0 && (
                                <p className="text-sm text-gray-600 mt-2">
                                    {selectedUserIds.length} felhasználó kiválasztva
                                </p>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                            {t.notes}
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-nexus-secondary focus:border-nexus-secondary"
                            placeholder="További megjegyzések vagy instrukciók..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary hover:bg-nexus-secondary rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isLoading ? t.creating : t.create}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTodoModal;