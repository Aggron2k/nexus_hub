"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { HiTrash, HiPencil, HiMapPin } from "react-icons/hi2";
import { MessageType } from "@prisma/client";
import Avatar from "@/app/components/Avatar";
import ReactionButtons from "./ReactionButtons";
import CommentSection from "./CommentSection";

interface MessageWithRelations {
    id: string;
    title: string | null;
    content: string;
    imageUrl: string | null;
    type: MessageType;
    isPinned: boolean;
    pinnedAt: Date | null;
    createdAt: Date;
    authorId: string;
    author: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        role: string;
    };
    pinnedBy: {
        id: string;
        name: string | null;
    } | null;
    reactions: any[];
    comments: any[];
}

interface MessageCardProps {
    message: MessageWithRelations;
    currentUserId: string;
    currentUserRole: string;
    onUpdate?: () => void;
}

const MessageCard: React.FC<MessageCardProps> = ({
    message,
    currentUserId,
    currentUserRole,
    onUpdate
}) => {
    const router = useRouter();
    const { language } = useLanguage();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPinning, setIsPinning] = useState(false);

    const locale = language === 'hu' ? hu : enUS;

    const translations = {
        en: {
            pinned: "Pinned",
            delete: "Delete",
            pin: "Pin",
            unpin: "Unpin",
            types: {
                ANNOUNCEMENT: "Announcement",
                NEWS: "News",
                QUESTION: "Question",
                IDEA: "Idea",
                BIRTHDAY: "Birthday"
            }
        },
        hu: {
            pinned: "Rögzítve",
            delete: "Törlés",
            pin: "Rögzítés",
            unpin: "Rögzítés eltávolítása",
            types: {
                ANNOUNCEMENT: "Bejelentés",
                NEWS: "Hírek",
                QUESTION: "Kérdés",
                IDEA: "Ötlet",
                BIRTHDAY: "Születésnap"
            }
        }
    };

    const t = translations[language];

    const getTypeColor = (type: MessageType) => {
        switch (type) {
            case 'ANNOUNCEMENT': return 'bg-red-100 text-red-800';
            case 'NEWS': return 'bg-blue-100 text-blue-800';
            case 'QUESTION': return 'bg-yellow-100 text-yellow-800';
            case 'IDEA': return 'bg-purple-100 text-purple-800';
            case 'BIRTHDAY': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeEmoji = (type: MessageType) => {
        switch (type) {
            case 'ANNOUNCEMENT': return '📢';
            case 'NEWS': return '📰';
            case 'QUESTION': return '❓';
            case 'IDEA': return '💡';
            case 'BIRTHDAY': return '🎂';
            default: return '📝';
        }
    };

    const canDelete = () => {
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUserRole);
        const isAuthor = message.authorId === currentUserId;
        return isAuthor || isManager;
    };

    const canPin = () => {
        return ['GeneralManager', 'CEO'].includes(currentUserRole);
    };

    const handleDelete = async () => {
        if (!confirm(language === 'hu' ? 'Biztosan törölni szeretnéd ezt az üzenetet?' : 'Are you sure you want to delete this message?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await axios.delete(`/api/messages/${message.id}`);
            toast.success(language === 'hu' ? 'Üzenet törölve' : 'Message deleted');
            onUpdate?.();
            router.refresh();
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error(language === 'hu' ? 'Hiba történt' : 'Error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePin = async () => {
        setIsPinning(true);
        try {
            await axios.post(`/api/messages/${message.id}/pin`);
            toast.success(
                message.isPinned
                    ? (language === 'hu' ? 'Rögzítés eltávolítva' : 'Unpinned')
                    : (language === 'hu' ? 'Üzenet rögzítve' : 'Message pinned')
            );
            onUpdate?.();
            router.refresh();
        } catch (error) {
            console.error('Error pinning message:', error);
            toast.error(language === 'hu' ? 'Hiba történt' : 'Error occurred');
        } finally {
            setIsPinning(false);
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border ${message.isPinned ? 'border-nexus-primary border-2' : 'border-gray-200'}`}>
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar user={message.author as any} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900">{message.author.name}</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(message.type)}`}>
                                    <span>{getTypeEmoji(message.type)}</span>
                                    {t.types[message.type]}
                                </span>
                                {message.isPinned && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-nexus-primary text-nexus-tertiary">
                                        <HiMapPin className="h-3 w-3" />
                                        {t.pinned}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale })}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-2">
                        {canPin() && (
                            <button
                                onClick={handlePin}
                                disabled={isPinning}
                                className="text-nexus-secondary hover:text-nexus-tertiary p-1 transition-colors"
                                title={message.isPinned ? t.unpin : t.pin}
                            >
                                <HiMapPin className={`h-5 w-5 ${message.isPinned ? 'fill-current' : ''}`} />
                            </button>
                        )}
                        {canDelete() && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                title={t.delete}
                            >
                                <HiTrash className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Title */}
                {message.title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{message.title}</h3>
                )}

                {/* Content */}
                <p className="text-gray-700 whitespace-pre-wrap break-words mb-3">{message.content}</p>

                {/* Image */}
                {message.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                        <img
                            src={message.imageUrl}
                            alt="Message image"
                            className="w-full h-auto max-h-96 object-contain bg-gray-100"
                        />
                    </div>
                )}

                {/* Reactions */}
                <div className="mb-3">
                    <ReactionButtons
                        messageId={message.id}
                        reactions={message.reactions}
                        currentUserId={currentUserId}
                        onUpdate={onUpdate}
                    />
                </div>

                {/* Comments */}
                <CommentSection
                    messageId={message.id}
                    comments={message.comments}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onUpdate={onUpdate}
                />
            </div>
        </div>
    );
};

export default MessageCard;
