'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import useRoutes from "@/app/hooks/useRoutes";
import DesktopItem from "./DesktopItem";
import Avatar from "@/app/components/Avatar";
import Image from "next/image";
import Link from 'next/link';

import { User } from "@prisma/client";

interface DesktopSidebarProps {
    currentUser: User;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
    currentUser
}) => {
    const routes = useRoutes();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleAvatarClick = () => {
        // Navigáció a saját profilhoz a users oldalon
        router.push(`/users/${currentUser.id}`);
    };

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-20 xl:px-6 lg:overflow-hidden bg-nexus-tertiary lg:border-r-[1px] lg:pb-4 lg:flex lg:flex-col justify-between">
            {/* Logo Section */}
            <nav className="flex items-center justify-center py-4">
                <Link href="/dashboard" passHref>{/* Dashboard */}
                    <Image alt="logo" height="48" width="48" className='mx-auto w-auto' src="/images/logo_revert.png" />
                </Link>
            </nav>

            {/* Navigation Items */}
            <nav className="mt-4 flex flex-col justify-between">
                <ul role="list" className="flex flex-col items-center space-y-1">
                    {routes.map((item) => (
                        <DesktopItem
                            key={item.label}
                            href={item.href}
                            label={item.label}
                            icon={item.icon}
                            active={item.active}
                            onClick={item.onClick}
                        />
                    ))}
                </ul>
            </nav>

            {/* Avatar Section */}
            <nav className="mt-4 flex flex-col justify-between items-center">
                <div
                    onClick={handleAvatarClick}
                    className="cursor-pointer hover:opacity-75 transition"
                    title="Saját profil megtekintése"
                >
                    <Avatar user={currentUser} />
                </div>
            </nav>
        </div>
    );
}

export default DesktopSidebar;