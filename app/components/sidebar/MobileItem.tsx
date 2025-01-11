"use client";

import Link from "next/link";
import clsx from "clsx";

interface MobileItemProps {
    href: string;
    label: string; // Megjelenő szöveg
    icon: any;
    active?: boolean;
    onClick?: () => void;
}

const MobileItem: React.FC<MobileItemProps> = ({
    href,
    label, // Label itt kerül felhasználásra
    icon: Icon,
    active,
    onClick,
}) => {
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <Link
            onClick={handleClick}
            href={href}
            className={clsx(
                `group flex items-center gap-x-3 px-4 py-2 text-sm leading-6 font-semibold hover:bg-nexus-primary transition`,
                active ? "bg-nexus-secondary text-black" : "text-white"
            )}
        >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </Link>
    );
};

export default MobileItem;
