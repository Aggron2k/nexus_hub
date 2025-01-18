"use client";

import { HiChevronLeft } from "react-icons/hi2";
import Link from "next/link";
import Avatar from "@/app/components/Avatar";
import { useLanguage } from "@/app/context/LanguageContext";
import { User } from "@prisma/client";

interface HeaderProps {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
        role?: string;
    };
    documentsId: string;
}

const Header: React.FC<HeaderProps> = ({ user, documentsId }) => {
    const { language } = useLanguage();

    const translations = {
        en: {
            documents: "'s Documents",
        },
        hu: {
            documents: " Dokumentumai",
        },
    };

    const t = translations[language];

    // Minimalizált objektum az Avatar számára
    const avatarUser: Partial<User> = {
        id: user.id,
        name: user.name || null,
        email: user.email,
        image: user.image || null,
    };

    return (
        <div className="bg-white w-full flex border-b-[1px] sm:px-4 py-3 px-4 lg:px-6 justify-between items-center shadow-sm">
            <div className="flex gap-3 items-center">
                <Link
                    className="lg:hidden block text-nexus-tertiary hover:text-nexus-secondary transition cursor-pointer"
                    href="/"
                >
                    <HiChevronLeft size={32} />
                </Link>
                <Avatar user={avatarUser as User} />
                <div className="flex flex-col">
                    <div className="text-lg font-bold">{`${user.name}${t.documents}`}</div>
                    <div className="text-sm font-light text-neutral-500">
                        {user.role} | {user.email}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
