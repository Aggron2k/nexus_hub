// app/todos/components/TodoList.tsx
"use client";

import clsx from "clsx";
import { useState, useEffect, useRef } from "react";
import { User } from "@prisma/client";
import TodoBox from "./TodoBox";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter, usePathname } from "next/navigation";
import { HiPlus } from "react-icons/hi2";
import axios from "axios";
import CreateTodoModal from "./CreateTodoModal";
import { pusherClient } from "@/app/libs/pusher";

interface TodoAssignment {
    id: string;
    userId: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
    completedAt: Date | null;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        userPositions?: Array<{
            isPrimary: boolean;
            position: {
                id: string;
                name: string;
                displayNames: {
                    en: string;
                    hu: string;
                };
                color: string;
            };
        }>;
    };
}

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
    assignments: TodoAssignment[];
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    targetPosition: {
        id: string;
        name: string;
        displayNames: {
            en: string;
            hu: string;
        };
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
    const pusherInitialized = useRef(false);

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

    // Fetch todos only once on mount
    useEffect(() => {
        fetchTodos();
    }, []);

    // Setup Pusher subscription
    useEffect(() => {
        if (!currentUser?.email || pusherInitialized.current) return;

        pusherInitialized.current = true;
        const channelName = `private-${currentUser.email}`;
        console.log('Subscribing to Pusher channel:', channelName);
        const channel = pusherClient.subscribe(channelName);

        // Listen for new TODO creation
        channel.bind('todo:new', (newTodo: TodoWithRelations) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] Pusher todo:new event received:`, newTodo.id, newTodo.title);
            setTodos(prev => {
                console.log(`[${timestamp}] Current todos count:`, prev.length, 'IDs:', prev.map(t => t.id));
                // Ellenőrizzük hogy már létezik-e (duplikáció elkerülése)
                const exists = prev.some(todo => todo.id === newTodo.id);
                if (exists) {
                    console.log(`[${timestamp}] TODO already exists in list, skipping duplicate:`, newTodo.id);
                    return prev;
                }
                console.log(`[${timestamp}] Adding new TODO to list:`, newTodo.id);
                return [newTodo, ...prev];
            });
        });

        // Listen for TODO updates
        channel.bind('todo:update', (updatedTodo: TodoWithRelations) => {
            console.log('Pusher todo:update event received:', updatedTodo);
            setTodos(prev => prev.map(todo =>
                todo.id === updatedTodo.id ? updatedTodo : todo
            ));
        });

        // Listen for TODO deletion
        channel.bind('todo:delete', (data: { todoId: string }) => {
            console.log('Pusher todo:delete event received:', data);
            setTodos(prev => {
                const newTodos = prev.filter(todo => todo.id !== data.todoId);
                console.log('Filtered todos:', newTodos.length, 'from', prev.length);
                return newTodos;
            });
        });

        // Cleanup - csak production-ben vagy amikor valóban unmount-ol
        return () => {
            // React StrictMode alatt ne unsubscribe-oljunk
            if (process.env.NODE_ENV === 'production') {
                console.log('Unsubscribing from Pusher channel:', channelName);
                channel.unbind_all();
                pusherClient.unsubscribe(channelName);
                pusherInitialized.current = false;
            }
        };
    }, [currentUser?.email]);

    useEffect(() => {
        // Reset selectedTodoId when on /todos page
        if (pathname === "/todos") {
            setSelectedTodoId(null);
            // Re-fetch todos amikor visszatérünk a /todos page-re
            fetchTodos();
        } else {
            // Extract todo ID from URL
            const todoIdMatch = pathname.match(/\/todos\/(.+)/);
            if (todoIdMatch) {
                setSelectedTodoId(todoIdMatch[1]);
            }
        }
    }, [pathname]);

    const getPositionDisplayName = (position: { displayNames: { en: string; hu: string; }; name: string; }) => {
        if (!position || !position.displayNames) {
            return 'N/A';
        }
        return position.displayNames[language] || position.displayNames['hu'] || position.name;
    };

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

    const handleTodoDelete = (todoId: string) => {
        setTodos(prev => prev.filter(todo => todo.id !== todoId));
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