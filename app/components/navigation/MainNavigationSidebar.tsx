'use client';

import useRoutes from "@/app/hooks/useRoutes";
import NavigationMenuItem from "./NavigationMenuItem";
import NavigationLogo from "./NavigationLogo";
import ProfileNavigationButton from "./ProfileNavigationButton";
import { User } from "@prisma/client";

/**
 * MainNavigationSidebar Props Interface
 */
interface MainNavSidebarProps {
    /** Current authenticated user */
    currentUser: User;
}

/**
 * MainNavigationSidebar Component
 *
 * The main desktop navigation sidebar for the application.
 * Displays logo, navigation menu items, and user profile button.
 * Only visible on large screens (lg breakpoint and above).
 *
 * @example
 * ```tsx
 * <MainNavigationSidebar currentUser={user} />
 * ```
 */
const MainNavigationSidebar: React.FC<MainNavSidebarProps> = ({
    currentUser
}) => {
    const navigationRoutes = useRoutes();

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-20 xl:px-6 lg:overflow-hidden bg-nexus-tertiary lg:border-r-[1px] lg:pb-4 lg:flex lg:flex-col justify-between">
            {/* Logo Section */}
            <NavigationLogo
                destinationPath="/dashboard"
                logoSrc="/images/logo_revert.png"
                altText="Nexus HUB Logo"
            />

            {/* Navigation Menu Items */}
            <nav className="mt-4 flex flex-col justify-between">
                <ul role="list" className="flex flex-col items-center space-y-1">
                    {navigationRoutes.map((route) => (
                        <NavigationMenuItem
                            key={route.label}
                            routePath={route.href}
                            displayText={route.label}
                            IconComponent={route.icon}
                            isCurrentRoute={route.active}
                            onClickHandler={route.onClick}
                        />
                    ))}
                </ul>
            </nav>

            {/* User Profile Button */}
            <ProfileNavigationButton currentUserData={currentUser} />
        </div>
    );
}

export default MainNavigationSidebar;
