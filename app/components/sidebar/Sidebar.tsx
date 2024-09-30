import DesktopSidebar from "./DesktopSidebar";

async function Sidebar({children}:{
    children: React.ReactNode;
}){
    return (
        <div className="h-full">
            <main className="lg:pl-20 h-full">
                <DesktopSidebar/>
            {children}
            </main>
        </div>
    )
}

export default Sidebar;