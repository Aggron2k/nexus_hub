"use client";

import { User } from "@prisma/client";
import { useLanguage } from "@/app/context/LanguageContext";

// Temporary interface until we implement full Todo model
interface TodoWithRelations {
    id: string;
    title: string;
    // Add other properties as needed
}

interface TodoListProps {
    todos: TodoWithRelations[];
    onTodoUpdate: (todo: TodoWithRelations) => void;
    currentUser: User;
}

const TodoList: React.FC<TodoListProps> = ({
    todos,
    onTodoUpdate,
    currentUser
}) => {
    const { language } = useLanguage();

    const translations = {
        en: {
            noTodos: "No todos found",
            noTodosDescription: "No tasks match your current filters.",
        },
        hu: {
            noTodos: "Nincsenek feladatok",
            noTodosDescription: "Nincs olyan feladat, amely megfelel a szűrőknek.",
        },
    };

    const t = translations[language];

    if (todos.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noTodos}</h3>
                <p className="text-gray-500">{t.noTodosDescription}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {todos.map((todo) => (
                <TodoCard
                    key={todo.id}
                    todo={todo}
                    onUpdate={onTodoUpdate}
                    currentUser={currentUser}
                />
            ))}
        </div>
    );
};

export default TodoList;