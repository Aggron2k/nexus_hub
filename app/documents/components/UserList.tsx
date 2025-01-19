"use client";

import clsx from "clsx";
import { useState } from "react";
import { User } from "@prisma/client";
import UserBox from "./UserBox";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";

interface UserListProps {
    items: User[];
}

const UserList: React.FC<UserListProps> = ({ items }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const translations = {
        en: "Documents",
        hu: "Dokumentumok",
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        router.push(`/documents/${userId}`);
    };

    return (
        <aside
            className={clsx(
                `fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200`,
                selectedUserId ? "hidden lg:block" : "block w-full left-0"
            )}
        >
            <div className="px-5">
                <div className="flex justify-between mb-4 pt-4">
                    <div className="text-2xl font-bold text-neutral-800">
                        {translations[language]}
                    </div>
                </div>
                <div>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleSelectUser(item.id)}
                            className="cursor-pointer"
                        >
                            <UserBox data={item} />
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default UserList;