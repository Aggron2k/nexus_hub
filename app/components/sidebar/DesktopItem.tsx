'use client';
import clsx from 'clsx';
import Link from 'next/link';
import React, { useState } from 'react';

interface DesktopItemProps {
    label: string;
    icon: any;
    href: string;
    onClick?: () => void; // `onClick` opcionális
    active?: boolean;
}

const DesktopItem: React.FC<DesktopItemProps> = ({
    label,
    icon: Icon,
    href,
    onClick,
    active,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        if (onClick) {
            onClick(); // Az `onClick` függvény hívása
        }
    };

    return (
        <li
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative"
        >
            <Link
                href={href}
                className={clsx(
                    "group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold text-nexus-bg hover:text-black hover:bg-nexus-primary",
                    active && "bg-nexus-secondary text-black"
                )}
            >
                <Icon className="h-6 w-6 shrink-0" />
                <span className="sr-only">{label}</span>
            </Link>
            {isHovered && (
                <div
                    className="absolute left-1/2 transform -translate-x-1/2 top-full mt-3 bg-black text-white text-xs rounded-md px-2 py-1 shadow-lg z-50 whitespace-nowrap"
                    style={{
                        minWidth: "60px",
                        textAlign: "center",
                    }}
                >
                    {label}
                </div>
            )}
        </li>
    );
};

export default DesktopItem;
