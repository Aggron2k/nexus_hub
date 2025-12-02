'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiX } from "react-icons/hi";
import useRoutes from "@/app/hooks/useRoutes";
import MobileNavLink from "./MobileNavLink";
import MenuToggleButton from "./MenuToggleButton";
import UserProfileImage from "@/app/components/UserProfileImage";
import { User } from "@prisma/client";

/**
 * MobileNavigationDrawer Props Interface
 */
interface MobileNavDrawerProps {
    /** Current authenticated user (optional) */
    currentUser?: User;
}

/**
 * MobileNavigationDrawer Component
 *
 * A slide-out navigation drawer for mobile devices.
 * Features a hamburger menu button, slide-in menu, and dark overlay.
 * Only visible on screens smaller than lg breakpoint.
 *
 * @example
 * ```tsx
 * <MobileNavigationDrawer currentUser={user} />
 * ```
 */
const MobileNavigationDrawer: React.FC<MobileNavDrawerProps> = ({ currentUser }) => {
    const navigationRoutes = useRoutes();
    const router = useRouter();
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);

    const toggleNavigationDrawer = () => {
        setIsDrawerVisible((prevState) => !prevState);
    };

    const navigateToProfile = () => {
        if (currentUser) {
            router.push(`/users/${currentUser.id}`);
            setIsDrawerVisible(false);
        }
    };

    return (
        <div className="lg:hidden">
            {/* Floating Hamburger Menu Button */}
            <MenuToggleButton
                isMenuVisible={isDrawerVisible}
                onToggleClick={toggleNavigationDrawer}
            />

            {/* Slide-in Navigation Drawer */}
            <div
                className={`fixed top-0 left-0 z-40 h-full w-64 bg-nexus-tertiary text-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                    isDrawerVisible ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between p-4 border-b border-nexus-primary">
                        <span className="text-xl font-bold">Menu</span>
                        <button
                            onClick={() => setIsDrawerVisible(false)}
                            className="p-1 rounded-md hover:bg-nexus-primary transition-colors"
                            aria-label="Close menu"
                        >
                            <HiX className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto">
                        {navigationRoutes.map((route) => (
                            <MobileNavLink
                                key={route.href}
                                routePath={route.href}
                                displayText={route.label}
                                isCurrentRoute={route.active}
                                IconComponent={route.icon}
                                onClickHandler={() => {
                                    route.onClick?.();
                                    setIsDrawerVisible(false);
                                }}
                            />
                        ))}
                    </div>

                    {/* User Profile Section */}
                    {currentUser && (
                        <div className="border-t border-nexus-primary p-4">
                            <div
                                onClick={navigateToProfile}
                                className="flex items-center space-x-3 cursor-pointer hover:bg-nexus-primary rounded-lg p-2 transition-colors duration-200"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigateToProfile();
                                    }
                                }}
                            >
                                <UserProfileImage userData={currentUser} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {currentUser.name || 'Your Profile'}
                                    </p>
                                    <p className="text-xs text-gray-300 truncate">
                                        View profile
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dark Overlay */}
            {isDrawerVisible && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
                    onClick={() => setIsDrawerVisible(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};

export default MobileNavigationDrawer;
