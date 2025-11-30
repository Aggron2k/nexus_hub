"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { HiTrash, HiChatBubbleLeft } from "react-icons/hi2";
import Avatar from "@/app/components/Avatar";

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    authorId: string;
    author: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

interface CommentSectionProps {
    messageId: string;
    comments: Comment[];
    currentUserId: string;
    currentUserRole: string;
    onUpdate?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
    messageId,
    comments,
    currentUserId,
    currentUserRole,
    onUpdate
}) => {
    const { language } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const locale = language === 'hu' ? hu : enUS;

    const translations = {
        en: {
            comments: "Comments",
            addComment: "Add a comment...",
            post: "Post",
            showComments: "Show comments",
            hideComments: "Hide comments",
            noComments: "No comments yet"
        },
        hu: {
            comments: "Kommentek",
            addComment: "Írj egy kommentet...",
            post: "Küldés",
            showComments: "Kommentek mutatása",
            hideComments: "Kommentek elrejtése",
            noComments: "Még nincsenek kommentek"
        }
    };

    const t = translations[language];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await axios.post(`/api/messages/${messageId}/comments`, {
                content: newComment.trim()
            });
            setNewComment("");
            onUpdate?.();
            toast.success(language === 'hu' ? 'Komment hozzáadva!' : 'Comment added!');
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error(language === 'hu' ? 'Hiba történt' : 'Error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await axios.delete(`/api/messages/${messageId}/comments?commentId=${commentId}`);
            onUpdate?.();
            toast.success(language === 'hu' ? 'Komment törölve' : 'Comment deleted');
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error(language === 'hu' ? 'Hiba történt' : 'Error occurred');
        }
    };

    const canDeleteComment = (comment: Comment) => {
        const isManager = ['Manager', 'GeneralManager', 'CEO'].includes(currentUserRole);
        const isAuthor = comment.authorId === currentUserId;
        return isAuthor || isManager;
    };

    return (
        <div className="border-t border-gray-200 pt-3">
            {/* Comment toggle button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
            >
                <HiChatBubbleLeft className="h-4 w-4" />
                <span>
                    {comments.length > 0
                        ? `${comments.length} ${t.comments.toLowerCase()}`
                        : t.noComments
                    }
                </span>
            </button>

            {isExpanded && (
                <div className="space-y-3">
                    {/* Comments list */}
                    {comments.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-2 bg-gray-50 rounded-lg p-2">
                                    <Avatar user={comment.author as any} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-900">
                                                    {comment.author.name}
                                                </p>
                                                <p className="text-sm text-gray-700 mt-1 break-words">
                                                    {comment.content}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                                        addSuffix: true,
                                                        locale
                                                    })}
                                                </p>
                                            </div>
                                            {canDeleteComment(comment) && (
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title={language === 'hu' ? 'Törlés' : 'Delete'}
                                                >
                                                    <HiTrash className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add comment form */}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t.addComment}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="px-4 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-nexus-secondary hover:text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t.post}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CommentSection;
