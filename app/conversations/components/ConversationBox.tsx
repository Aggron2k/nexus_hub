"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Conversation, Message, User } from "@prisma/client";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { FullConversationType } from "@/app/types";
import useOtherUser from "@/app/hooks/useOtherUser";
import Avatar from "@/app/components/Avatar";
import AvatarGroup from "@/app/components/AvatarGroup";
import { useLanguage } from "@/app/context/LanguageContext";

interface ConversationBoxProps {
    data: FullConversationType,
    selected?: boolean;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({
    data,
    selected
}) => {
    const otherUser = useOtherUser(data);
    const session = useSession();
    const router = useRouter();

    const { language } = useLanguage(); // Nyelvi kontextus használata

    const translations = {
        en: {
            imageSent: "Sent a picture",
            messageStarted: "Message started",
        },
        hu: {
            imageSent: "Képet küldött",
            messageStarted: "Üzenet váltás elkezdve",
        },
    };

    const handleClick = useCallback(() => {
        router.push(`/conversations/${data.id}`);
    }, [data.id, router]);

    const lastMessage = useMemo(() => {
        const messages = data.messages || [];

        return messages[messages.length - 1];
    }, [data.messages]);

    const userEmail = useMemo(() => {
        return session.data?.user?.email;
    }, [session.data?.user?.email]);

    const hasSeen = useMemo(() => {
        if (!lastMessage) {
            return false;
        }

        const seenArray = lastMessage.seen || [];

        if (!userEmail) {
            return false;
        }

        return seenArray.filter((user) => user.email === userEmail).length !== 0;
    }, [userEmail, lastMessage]);

    const lastMessageText = useMemo(() => {
        if (lastMessage?.image) {
            return translations[language].imageSent;
        }

        if (lastMessage?.body) {
            return lastMessage.body;
        }

        return translations[language].messageStarted;
    }, [lastMessage, language, translations]);

    return (
        <div
            onClick={handleClick}
            className={clsx(
                "w-full relative flex items-center space-x-3 hover:bg-[#D4BEE4] rounded-lg transition cursor-pointer p-3",
                selected ? "bg-neutral-100" : "bg-white"
            )}
        >
            {data.isGroup ? (
                <AvatarGroup users={data.users} />
            ) : (
                <Avatar user={otherUser} />
            )}

            <div className="min-w-0 flex-1">
                <div className="focus:outline-none">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-md font-medium text-gray-900">
                            {data.name || otherUser?.name}
                        </p>
                        {lastMessage?.createdAt && (
                            <p className="text-xs text-gray-400 font-light">
                                {format(new Date(lastMessage.createdAt), "HH:mm")}
                            </p>
                        )}
                    </div>
                    <p
                        className={clsx(
                            "truncate text-sm",
                            hasSeen ? "text-gray-500" : "text-black"
                        )}
                    >
                        {lastMessageText}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConversationBox;
