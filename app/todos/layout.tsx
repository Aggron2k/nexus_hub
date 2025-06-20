import Sidebar from "../components/sidebar/Sidebar";

export default async function TodosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Sidebar>
            <div className="h-full">
                {children}
            </div>
        </Sidebar>
    );
}