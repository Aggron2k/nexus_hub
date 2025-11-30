"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import MessageCard from "./MessageCard";

interface MessageListProps {
    messages: any[];
    currentUserId: string;
    currentUserRole: string;
    onUpdate?: () => void;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    currentUserId,
    currentUserRole,
    onUpdate
}) => {
    const { language } = useLanguage();

    const translations = {
        en: {
            noMessages: "No messages found",
            noMessagesDesc: "Be the first to post a message!"
        },
        hu: {
            noMessages: "Nincsenek üzenetek",
            noMessagesDesc: "Légy te az első aki üzenetet ír!"
        }
    };

    const t = translations[language];

    if (messages.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-lg font-medium text-gray-900 mb-2">{t.noMessages}</p>
                <p className="text-sm text-gray-500">{t.noMessagesDesc}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {messages.map((message) => (
                <MessageCard
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onUpdate={onUpdate}
                />
            ))}
        </div>
    );
};

export default MessageList;
