'use client';

import Image from "next/image";
import Link from 'next/link';

/**
 * NavigationLogo Props Interface
 */
interface NavigationLogoProps {
    /** Link destination when logo is clicked */
    destinationPath?: string;
    /** Logo image source path */
    logoSrc?: string;
    /** Alt text for accessibility */
    altText?: string;
}

/**
 * NavigationLogo Component
 *
 * Displays the application logo in the navigation sidebar.
 * Clicking the logo navigates to the specified destination (default: dashboard).
 *
 * @example
 * ```tsx
 * <NavigationLogo
 *   destinationPath="/dashboard"
 *   logoSrc="/images/logo_revert.png"
 *   altText="Nexus HUB Logo"
 * />
 * ```
 */
const NavigationLogo: React.FC<NavigationLogoProps> = ({
    destinationPath = "/dashboard",
    logoSrc = "/images/logo_revert.png",
    altText = "Application Logo"
}) => {
    return (
        <nav className="flex items-center justify-center py-4">
            <Link href={destinationPath} passHref>
                <Image
                    alt={altText}
                    height={48}
                    width={48}
                    className="mx-auto w-auto"
                    src={logoSrc}
                />
            </Link>
        </nav>
    );
};

export default NavigationLogo;
