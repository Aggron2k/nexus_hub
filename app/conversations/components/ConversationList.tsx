"use client";

import clsx from "clsx";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdOutlineGroupAdd } from "react-icons/md";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import useConversation from "@/app/hooks/useConversation";
import { FullConversationType } from "@/app/types";
import ConversationBox from "./ConversationBox";
import { User } from "@prisma/client";
import GroupChatModal from "./GroupChatModal";
import NewConversationModal from "./NewConversationModal";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/app/libs/pusher";
import { find } from "lodash";
import { useLanguage } from "@/app/context/LanguageContext";

interface ConversationListProps {
    initialItems: FullConversationType[];
    users: User[];
}

const ConversationList: React.FC<ConversationListProps> = ({
    initialItems,
    users,
}) => {
    const [items, setItems] = useState(initialItems);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

    const router = useRouter();
    const { conversationId, isOpen } = useConversation();
    const session = useSession();

    // Language context
    const { language } = useLanguage();

    const pusherKey = useMemo(() => {
        return session.data?.user?.email;
    }, [session.data?.user?.email]);

    useEffect(() => {
        if (!pusherKey) {
            return;
        }

        pusherClient.subscribe(pusherKey);

        const newHandler = (conversation: FullConversationType) => {
            setItems((current) => {
                if (find(current, { id: conversation.id })) {
                    return current;
                }
                return [conversation, ...current];
            });
        };

        const updateHandler = (conversation: FullConversationType) => {
            setItems((current) =>
                current.map((currentConversation) => {
                    if (currentConversation.id === conversation.id) {
                        return {
                            ...currentConversation,
                            messages: conversation.messages,
                        };
                    }
                    return currentConversation;
                })
            );
        };

        const removeHandler = (conversation: FullConversationType) => {
            setItems((current) => {
                return [...current.filter((convo) => convo.id !== conversation.id)];
            });
            if (conversationId === conversation.id) {
                router.push("/conversations");
            }
        };

        pusherClient.bind("conversation:new", newHandler);
        pusherClient.bind("conversation:update", updateHandler);
        pusherClient.bind("conversation:remove", removeHandler);

        return () => {
            pusherClient.unsubscribe(pusherKey);
            pusherClient.unbind("conversation:new", newHandler);
            pusherClient.unbind("conversation:update", updateHandler);
            pusherClient.unbind("conversation:remove", removeHandler);
        };
    }, [pusherKey, conversationId, router]);

    // Translations
    const translations = {
        en: {
            title: "Chat",
            noConversations: "No conversations started.",
            newChat: "New Chat",
            groupChat: "Group Chat",
        },
        hu: {
            title: "Csevegés",
            noConversations: "Nincs beszélgetés elkezdve.",
            newChat: "Új beszélgetés",
            groupChat: "Csoportos beszélgetés",
        },
    };

    const t = translations[language];

    return (
        <>
            {/* Group Chat Modal */}
            <GroupChatModal
                users={users}
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
            />

            {/* New Conversation Modal */}
            <NewConversationModal
                users={users}
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
            />

            <aside
                className={clsx(
                    `fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-hidden border-r border-gray-200`,
                    isOpen ? "hidden" : "block w-full left-0"
                )}
            >
                <div className="px-5">
                    <div className="flex justify-between items-center mb-4 pt-4">
                        <div className="text-2xl font-bold text-neutral-800">
                            {t.title}
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-2">
                            {/* New Chat Button */}
                            <div
                                onClick={() => setIsNewChatModalOpen(true)}
                                className="rounded-full p-2 bg-nexus-tertiary text-white hover:bg-nexus-primary focus-visible:bg-nexus-primary cursor-pointer transition hover:text-black"
                                title={t.newChat}
                            >
                                <HiOutlineChatBubbleLeftRight size={20} />
                            </div>

                            {/* Group Chat Button */}
                            <div
                                onClick={() => setIsGroupModalOpen(true)}
                                className="rounded-full p-2 bg-nexus-tertiary text-white hover:bg-nexus-primary focus-visible:bg-nexus-primary cursor-pointer transition hover:text-black"
                                title={t.groupChat}
                            >
                                <MdOutlineGroupAdd size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Conversations list */}
                    <div>
                        {items && items.length > 0 ? (
                            items.map((item, i) => (
                                <ConversationBox
                                    key={item.id}
                                    data={item}
                                    selected={conversationId === item.id}
                                />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <p className="text-sm">{t.noConversations}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default ConversationList;