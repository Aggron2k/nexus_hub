"use client";

import { useState } from "react";
import { HiMenuAlt1, HiX } from "react-icons/hi"; // Hamburger és bezárás ikon
import useRoutes from "@/app/hooks/useRoutes";
import MobileItem from "./MobileItem";

const MobileFooter = () => {
    const routes = useRoutes();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    return (
        <div className="lg:hidden"> {/* Csak mobil nézetben látszik */}
            {/* Lebegő hamburger gomb */}
            <button
                onClick={toggleMenu}
                className="fixed bottom-[15px] left-4 z-50 bg-nexus-secondary p-3 rounded-full shadow-md text-white hover:bg-nexus-primary focus:outline-none"
            >
                {isMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenuAlt1 className="h-6 w-6" />}
            </button>



            {/* Oldalsó menü */}
            <div
                className={`fixed top-0 left-0 z-40 h-full w-64 bg-nexus-tertiary text-white shadow-lg transform transition-transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 text-xl font-bold border-b border-nexus-tertiary">
                        Menu
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {routes.map((route) => (
                            <MobileItem
                                key={route.href}
                                href={route.href}
                                label={route.label}
                                active={route.active}
                                icon={route.icon}
                                onClick={() => {
                                    route.onClick?.();
                                    setIsMenuOpen(false); // Menü bezárása kattintásra
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileFooter;
