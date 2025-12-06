// app/todos/layout.tsx
import ApplicationShell from "../components/navigation/ApplicationShell";
import TodoList from "./components/TodoList";
import getCurrentUser from "../actions/getCurrentUser";


export const dynamic = 'force-dynamic';
export default async function TodosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    return (
        <ApplicationShell>
            <div className="h-full">
                <TodoList currentUser={currentUser} />
                {children}
            </div>
        </ApplicationShell>
    );
}