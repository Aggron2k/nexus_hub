// app/todos/layout.tsx
import Sidebar from "../components/sidebar/Sidebar";
import TodoList from "./components/TodoList";
import getCurrentUser from "../actions/getCurrentUser";

export default async function TodosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    return (
        <Sidebar>
            <div className="h-full">
                <TodoList currentUser={currentUser} />
                {children}
            </div>
        </Sidebar>
    );
}