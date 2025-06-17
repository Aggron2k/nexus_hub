// app/todos/page.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import TodosClient from "./components/TodosClient";

const TodosPage = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return (
            <div className="lg:pl-80 h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-tertiary"></div>
                    <span className="text-gray-600">Authenticating...</span>
                </div>
            </div>
        );
    }

    return <TodosClient currentUser={currentUser} />;
};

export default TodosPage;