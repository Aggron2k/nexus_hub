"use client";

import { useState } from "react";
import { HiCheck, HiXMark } from "react-icons/hi2";

interface NotesEditorProps {
    initialNotes: string;
    onSave: (notes: string) => void;
    placeholder: string;
}

const NotesEditor: React.FC<NotesEditorProps> = ({
    initialNotes,
    onSave,
    placeholder
}) => {
    const [notes, setNotes] = useState(initialNotes);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(notes);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving notes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setNotes(initialNotes);
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div
                onClick={() => setIsEditing(true)}
                className="min-h-[80px] p-2 border border-gray-300 rounded cursor-text hover:border-gray-400 transition-colors bg-gray-50"
            >
                {notes ? (
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{notes}</p>
                ) : (
                    <p className="text-sm text-gray-500 italic">{placeholder}</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded focus:ring-nexus-secondary focus:border-nexus-secondary"
                disabled={isSaving}
            />
            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1 bg-nexus-tertiary text-white text-sm rounded hover:bg-nexus-secondary transition-colors disabled:opacity-50"
                >
                    <HiCheck className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                    <HiXMark className="h-4 w-4" />
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default TodoCard;
createdBy: {
    id: string;
    name: string;
    email: string;
};
}

interface Filters {
    userId?: string;
    position?: Position;
    status?: TodoStatus;
    startDate?: string;
    endDate?: string;
}

const TodosPage = () => {
    const [todos, setTodos] = useState<TodoWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filters, setFilters] = useState<Filters>({});

    const currentUser = useCurrentUser();
    const { language } = useLanguage();

    const translations = {
        en: {
            todos: "Todo List",
            createTodo: "Create Todo",
            noTodos: "No todos found",
            loading: "Loading todos...",
        },
        hu: {
            todos: "Feladatlista",
            createTodo: "Feladat létrehozása",
            noTodos: "Nincsenek feladatok",
            loading: "Feladatok betöltése...",
        },
    };

    const t = translations[language];

    const isManager = currentUser && ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

    const fetchTodos = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/api/todos?${queryParams.toString()}`);
            setTodos(response.data);
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, [filters]);

    const handleTodoUpdate = (updatedTodo: TodoWithRelations) => {
        setTodos(prev => prev.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo
        ));
    };

    const handleTodoCreate = (newTodos: TodoWithRelations[]) => {
        setTodos(prev => [...newTodos, ...prev]);
        setShowCreateModal(false);
    };

    if (!currentUser) {
        return <div>Loading...</div>;
    }

    return (
        <div className="lg:pl-80 h-full">
            <div className="h-full flex flex-col bg-nexus-bg">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">{t.todos}</h1>
                        {isManager && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-nexus-tertiary text-white rounded-lg hover:bg-nexus-secondary transition-colors"
                            >
                                <HiPlus className="h-5 w-5" />
                                {t.createTodo}
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <TodoFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    isManager={isManager}
                />

                {/* Todo List */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-tertiary"></div>
                            <span className="ml-3 text-gray-600">{t.loading}</span>
                        </div>
                    ) : (
                        <TodoList
                            todos={todos}
                            onTodoUpdate={handleTodoUpdate}
                            currentUser={currentUser}
                        />
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

export default TodosPage;