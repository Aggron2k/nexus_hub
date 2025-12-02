'use client';

import { HiMenuAlt1, HiX } from "react-icons/hi";

/**
 * MenuToggleButton Props Interface
 */
interface MenuToggleProps {
    /** Whether the menu is currently open */
    isMenuVisible: boolean;
    /** Click handler to toggle menu state */
    onToggleClick: () => void;
}

/**
 * MenuToggleButton Component
 *
 * A floating hamburger menu button that toggles between menu and close icons.
 * Typically used for mobile navigation drawers.
 *
 * @example
 * ```tsx
 * <MenuToggleButton
 *   isMenuVisible={isOpen}
 *   onToggleClick={handleToggle}
 * />
 * ```
 */
const MenuToggleButton: React.FC<MenuToggleProps> = ({
    isMenuVisible,
    onToggleClick
}) => {
    return (
        <button
            onClick={onToggleClick}
            className="fixed bottom-[15px] right-4 z-50 bg-nexus-secondary p-3 rounded-full shadow-md text-white hover:bg-nexus-primary focus:outline-none transition-colors duration-200"
            aria-label={isMenuVisible ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuVisible}
        >
            {isMenuVisible ? (
                <HiX className="h-6 w-6" />
            ) : (
                <HiMenuAlt1 className="h-6 w-6" />
            )}
        </button>
    );
};

export default MenuToggleButton;
