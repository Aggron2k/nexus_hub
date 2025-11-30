"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { HiChatBubbleLeftRight, HiArrowRight } from "react-icons/hi2";
import { MessageType } from "@prisma/client";
import Avatar from "@/app/components/Avatar";
import ReactionButtons from "./ReactionButtons";
import CommentSection from "./CommentSection";

export default function MessageBoardWidget() {
    const router = useRouter();
    const { language } = useLanguage();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [latestMessage, setLatestMessage] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const locale = language === 'hu' ? hu : enUS;

    const translations = {
        en: {
            title: "Latest Message",
            viewAll: "View All Messages",
            noMessages: "No messages yet",
            types: {
                ANNOUNCEMENT: "Announcement",
                NEWS: "News",
                QUESTION: "Question",
                IDEA: "Idea",
                BIRTHDAY: "Birthday"
            }
        },
        hu: {
            title: "Legutóbbi üzenet",
            viewAll: "Összes üzenet",
            noMessages: "Még nincsenek üzenetek",
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [userRes, messagesRes] = await Promise.all([
                    axios.get('/api/users/me'),
                    axios.get('/api/messages')
                ]);
                setCurrentUser(userRes.data);
                if (messagesRes.data.length > 0) {
                    setLatestMessage(messagesRes.data[0]);
                }
            } catch (error) {
                console.error('Error fetching message board data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRefresh = async () => {
        try {
            const response = await axios.get('/api/messages');
            if (response.data.length > 0) {
                setLatestMessage(response.data[0]);
            }
        } catch (error) {
            console.error('Error refreshing:', error);
        }
    };

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

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-nexus-primary rounded-lg">
                            <HiChatBubbleLeftRight className="h-5 w-5 text-nexus-tertiary" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
                    </div>
                    <button
                        onClick={() => router.push('/messages')}
                        className="flex items-center gap-1 text-sm text-nexus-secondary hover:text-nexus-tertiary transition-colors"
                    >
                        <span>{t.viewAll}</span>
                        <HiArrowRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                {latestMessage && currentUser ? (
                    <div className="space-y-3">
                        {/* Message header */}
                        <div className="flex items-start gap-3">
                            <Avatar user={latestMessage.author} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm text-gray-900">
                                        {latestMessage.author.name}
                                    </p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(latestMessage.type)}`}>
                                        <span>{getTypeEmoji(latestMessage.type)}</span>
                                        {t.types[latestMessage.type as MessageType]}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatDistanceToNow(new Date(latestMessage.createdAt), {
                                        addSuffix: true,
                                        locale
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Title */}
                        {latestMessage.title && (
                            <h4 className="text-sm font-semibold text-gray-900">
                                {latestMessage.title}
                            </h4>
                        )}

                        {/* Content */}
                        <p className="text-sm text-gray-700 line-clamp-3">
                            {latestMessage.content}
                        </p>

                        {/* Image */}
                        {latestMessage.imageUrl && (
                            <div className="rounded-lg overflow-hidden">
                                <img
                                    src={latestMessage.imageUrl}
                                    alt="Message image"
                                    className="w-full h-32 object-cover"
                                />
                            </div>
                        )}

                        {/* Reactions */}
                        <div>
                            <ReactionButtons
                                messageId={latestMessage.id}
                                reactions={latestMessage.reactions}
                                currentUserId={currentUser.id}
                                onUpdate={handleRefresh}
                            />
                        </div>

                        {/* Comments */}
                        <CommentSection
                            messageId={latestMessage.id}
                            comments={latestMessage.comments}
                            currentUserId={currentUser.id}
                            currentUserRole={currentUser.role}
                            onUpdate={handleRefresh}
                        />
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">{t.noMessages}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
