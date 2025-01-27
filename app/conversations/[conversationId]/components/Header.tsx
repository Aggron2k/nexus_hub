"use client";

import { Conversation, User } from "@prisma/client";
import useOtherUser from "@/app/hooks/useOtherUser";
import { useMemo } from "react";
import Link from "next/link";
import { HiChevronLeft, HiEllipsisHorizontal } from "react-icons/hi2";
import Avatar from "@/app/components/Avatar";
import { useState } from "react";
import ProfileDrawer from "./ProfilDrawer";
import AvatarGroup from "@/app/components/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";
import { useLanguage } from "@/app/context/LanguageContext";

interface HeaderProps {
    conversation: Conversation & {
        users: User[]
    }
};

const Header: React.FC<HeaderProps> = ({
    conversation
}) => {
    const otherUser = useOtherUser(conversation);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { language } = useLanguage();

    const translations = {
        en: {
            members: "members",
            active: "Active",
            offline: "Offline"
        },
        hu: {
            members: "tag",
            active: "Aktív",
            offline: "Offline"
        }
    };

    const { members } = useActiveList();
    const isActive = members.indexOf(otherUser.email!) !== -1;

    const statusText = useMemo(() => {
        if (conversation.isGroup) {
            return `${conversation.users.length} ${translations[language].members}`;
        }

        return isActive ? translations[language].active : translations[language].offline;
    }, [conversation, isActive, language]);

    if (conversation && conversation.id) {
        return (
            <>
                <ProfileDrawer data={conversation} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
                <div className="bg-white w-full flex border-b-[1px] sm:px-4 py-3 px-4 lg:px-6 justify-between items-center shadow-sm">
                    <div className="flex gap-3 items-center">
                        <Link className="lg:hidden block text-nexus-tertiary hover:text-nexus-secondary transition cursor-pointer" href="/conversations">
                            <HiChevronLeft size={32} />
                        </Link>
                        {conversation.isGroup ? (
                            <AvatarGroup users={conversation.users} />
                        ) : (
                            <Avatar user={otherUser} />
                        )}
                        <div className="flex flex-col">
                            <div>
                                {conversation.name || otherUser.name}
                            </div>
                            <div className="text-sm font-light text-neutral-500">
                                {statusText}
                            </div>
                        </div>
                    </div>
                    <HiEllipsisHorizontal size={32} onClick={() => setDrawerOpen(true)} className="text-nexus-tertiary hover:text-nexus-secondary cursor-pointer transition" />
                </div>
            </>
        );
    }
}

export default Header;