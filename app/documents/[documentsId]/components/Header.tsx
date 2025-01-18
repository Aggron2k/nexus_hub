"use client";

import { HiChevronLeft } from "react-icons/hi2";
import Link from "next/link";
import Avatar from "@/app/components/Avatar";

interface HeaderProps {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    documentsId: string;
}

const Header: React.FC<HeaderProps> = ({ user, documentsId }) => {
    return (
        <div className="bg-white w-full flex border-b-[1px] sm:px-4 py-3 px-4 lg:px-6 justify-between items-center shadow-sm">
            <div className="flex gap-3 items-center">
                <Link
                    className="lg:hidden block text-nexus-tertiary hover:text-nexus-secondary transition cursor-pointer"
                    href="/"
                >
                    <HiChevronLeft size={32} />
                </Link>
                {/* Avatar átadása a user adattal */}
                <Avatar user={user} />
                <div className="flex flex-col">
                    <div className="text-lg font-bold">{user.name}'s Documents</div>
                    <div className="text-sm font-light text-neutral-500">
                        {user.email}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
