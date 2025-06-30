"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiMenuAlt1, HiX } from "react-icons/hi";
import useRoutes from "@/app/hooks/useRoutes";
import MobileItem from "./MobileItem";
import Avatar from "@/app/components/Avatar";
import { User } from "@prisma/client";

interface MobileFooterProps {
    currentUser?: User;
}

const MobileFooter: React.FC<MobileFooterProps> = ({ currentUser }) => {
    const routes = useRoutes();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    const handleAvatarClick = () => {
        if (currentUser) {
            router.push(`/users/${currentUser.id}`);
            setIsMenuOpen(false); // Menü bezárása navigáció után
        }
    };

    return (
        <div className="lg:hidden">
            {/* Lebegő hamburger gomb */}
            <button
                onClick={toggleMenu}
                className="fixed bottom-[15px] right-4 z-50 bg-nexus-secondary p-3 rounded-full shadow-md text-white hover:bg-nexus-primary focus:outline-none"
            >
                {isMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenuAlt1 className="h-6 w-6" />}
            </button>

            {/* Oldalsó menü */}
            <div
                className={`fixed top-0 left-0 z-40 h-full w-64 bg-nexus-tertiary text-white shadow-lg transform transition-transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header with close button */}
                    <div className="flex items-center justify-between p-4 border-b border-nexus-primary">
                        <span className="text-xl font-bold">Menu</span>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-1 rounded-md hover:bg-nexus-primary transition-colors"
                        >
                            <HiX className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation Items */}
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
                                    setIsMenuOpen(false);
                                }}
                            />
                        ))}
                    </div>

                    {/* Avatar Section */}
                    {currentUser && (
                        <div className="border-t border-nexus-primary p-4">
                            <div
                                onClick={handleAvatarClick}
                                className="flex items-center space-x-3 cursor-pointer hover:bg-nexus-primary rounded-lg p-2 transition-colors"
                            >
                                <Avatar user={currentUser} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {currentUser.name || 'Saját profil'}
                                    </p>
                                    <p className="text-xs text-gray-300 truncate">
                                        Profil megtekintése
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default MobileFooter;