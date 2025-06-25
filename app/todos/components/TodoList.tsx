// app/todos/components/TodoList.tsx
"use client";

import clsx from "clsx";
import { useState, useEffect } from "react";
import { User } from "@prisma/client";
import TodoBox from "./TodoBox";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter, usePathname } from "next/navigation";
import { HiPlus } from "react-icons/hi2";
import axios from "axios";
import CreateTodoModal from "./CreateTodoModal";

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

interface TodoListProps {
    currentUser: User | null;
}

const TodoList: React.FC<TodoListProps> = ({ currentUser }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { language } = useLanguage();
    const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
    const [todos, setTodos] = useState<TodoWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const translations = {
        en: {
            todos: "Todos",
            createTodo: "Create Todo",
            noTodos: "No todos found",
            loading: "Loading todos..."
        },
        hu: {
            todos: "Feladatok",
            createTodo: "Feladat létrehozása",
            noTodos: "Nincsenek feladatok",
            loading: "Feladatok betöltése..."
        },
    };

    const t = translations[language];
    const isManager = currentUser && ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

    useEffect(() => {
        fetchTodos();
    }, []);

    useEffect(() => {
        // Reset selectedTodoId when on /todos page
        if (pathname === "/todos") {
            setSelectedTodoId(null);
        } else {
            // Extract todo ID from URL
            const todoIdMatch = pathname.match(/\/todos\/(.+)/);
            if (todoIdMatch) {
                setSelectedTodoId(todoIdMatch[1]);
            }
        }
    }, [pathname]);

    const fetchTodos = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/todos');
            setTodos(response.data);
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTodo = (todoId: string) => {
        setSelectedTodoId(todoId);
        router.push(`/todos/${todoId}`);
    };

    const handleTodoCreate = (newTodos: TodoWithRelations[]) => {
        setTodos(prev => [...newTodos, ...prev]);
        setShowCreateModal(false);
    };

    const handleTodoUpdate = (updatedTodo: TodoWithRelations) => {
        setTodos(prev => prev.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo
        ));
    };

    return (
        <>
            <aside
                className={clsx(
                    `fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200`,
                    pathname === "/todos" ? "block w-full left-0" : "hidden lg:block"
                )}
            >
                <div className="px-5">
                    <div className="flex justify-between items-center mb-4 pt-4">
                        <div className="text-2xl font-bold text-neutral-800">
                            {t.todos}
                        </div>
                        {isManager && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="rounded-full p-2 bg-nexus-tertiary text-white hover:bg-nexus-primary focus-visible:bg-nexus-primary cursor-pointer transition hover:text-black"
                                title={t.createTodo}
                            >
                                <HiPlus className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-nexus-tertiary"></div>
                                <span className="ml-2 text-sm text-gray-600">{t.loading}</span>
                            </div>
                        ) : todos.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">{t.noTodos}</p>
                            </div>
                        ) : (
                            todos.map((todo) => (
                                <div
                                    key={todo.id}
                                    onClick={() => handleSelectTodo(todo.id)}
                                    className="cursor-pointer"
                                >
                                    <TodoBox
                                        todo={todo}
                                        isSelected={selectedTodoId === todo.id}
                                        onUpdate={handleTodoUpdate}
                                        currentUser={currentUser}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>

            {/* Create Todo Modal */}
            {isManager && showCreateModal && (
                <CreateTodoModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onTodoCreate={handleTodoCreate}
                />
            )}
        </>
    );
};

export default TodoList;