'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';

/**
 * NavigationMenuItem Props Interface
 */
interface NavMenuItemProps {
    /** Display text for the menu item */
    displayText: string;
    /** Icon component to render */
    IconComponent: any;
    /** Route path for navigation */
    routePath: string;
    /** Optional click handler */
    onClickHandler?: () => void;
    /** Whether this route is currently active */
    isCurrentRoute?: boolean;
}

/**
 * NavigationMenuItem Component
 *
 * A navigation menu item for the desktop sidebar.
 * Displays an icon with a tooltip on hover.
 *
 * @example
 * ```tsx
 * <NavigationMenuItem
 *   displayText="Dashboard"
 *   IconComponent={HiHome}
 *   routePath="/dashboard"
 *   isCurrentRoute={true}
 * />
 * ```
 */
const NavigationMenuItem: React.FC<NavMenuItemProps> = ({
    displayText,
    IconComponent,
    routePath,
    onClickHandler,
    isCurrentRoute = false,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleNavigation = () => {
        if (onClickHandler) {
            onClickHandler();
        }
    };

    return (
        <li
            onClick={handleNavigation}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="relative"
        >
            <Link
                href={routePath}
                className={clsx(
                    "rounded-md p-3 flex gap-x-3 font-semibold text-sm leading-6 group",
                    "text-nexus-bg hover:text-black hover:bg-nexus-primary transition-colors duration-200",
                    isCurrentRoute && "bg-nexus-secondary text-black"
                )}
            >
                <IconComponent className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span className="sr-only">{displayText}</span>
            </Link>

            {showTooltip && (
                <div
                    className="absolute left-1/2 transform -translate-x-1/2 top-full mt-3 bg-black text-white text-xs rounded-md px-2 py-1 shadow-lg z-50 whitespace-nowrap pointer-events-none"
                    role="tooltip"
                    style={{
                        minWidth: "60px",
                        textAlign: "center",
                    }}
                >
                    {displayText}
                </div>
            )}
        </li>
    );
};

export default NavigationMenuItem;
