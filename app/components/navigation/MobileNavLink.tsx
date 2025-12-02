'use client';

import Link from "next/link";
import clsx from "clsx";

/**
 * MobileNavLink Props Interface
 */
interface MobileNavProps {
    /** Route path for navigation */
    routePath: string;
    /** Display text for the link */
    displayText: string;
    /** Icon component to render */
    IconComponent: any;
    /** Whether this route is currently active */
    isCurrentRoute?: boolean;
    /** Optional click handler */
    onClickHandler?: () => void;
}

/**
 * MobileNavLink Component
 *
 * A navigation link item for the mobile drawer menu.
 * Displays an icon and label text.
 *
 * @example
 * ```tsx
 * <MobileNavLink
 *   routePath="/dashboard"
 *   displayText="Dashboard"
 *   IconComponent={HiHome}
 *   isCurrentRoute={true}
 * />
 * ```
 */
const MobileNavLink: React.FC<MobileNavProps> = ({
    routePath,
    displayText,
    IconComponent,
    isCurrentRoute = false,
    onClickHandler,
}) => {
    const handleMobileNav = () => {
        if (onClickHandler) {
            onClickHandler();
        }
    };

    return (
        <Link
            onClick={handleMobileNav}
            href={routePath}
            className={clsx(
                "flex items-center gap-x-3 px-4 py-2 font-semibold text-sm leading-6 group",
                "hover:bg-nexus-primary transition-colors duration-200",
                isCurrentRoute ? "bg-nexus-secondary text-black" : "text-white"
            )}
        >
            <IconComponent className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{displayText}</span>
        </Link>
    );
};

export default MobileNavLink;
