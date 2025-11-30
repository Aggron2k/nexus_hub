"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Reaction {
    id: string;
    emoji: string;
    userId: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

interface ReactionButtonsProps {
    messageId: string;
    reactions: Reaction[];
    currentUserId: string;
    onUpdate?: () => void;
}

const AVAILABLE_EMOJIS = ["👍", "❤️", "😄", "🎉"];

const ReactionButtons: React.FC<ReactionButtonsProps> = ({
    messageId,
    reactions,
    currentUserId,
    onUpdate
}) => {
    const [isLoading, setIsLoading] = useState(false);

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return acc;
    }, {} as Record<string, Reaction[]>);

    const handleReaction = async (emoji: string) => {
        setIsLoading(true);
        try {
            await axios.post(`/api/messages/${messageId}/reactions`, { emoji });
            onUpdate?.();
        } catch (error: any) {
            console.error('Error toggling reaction:', error);
            toast.error('Failed to react');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {AVAILABLE_EMOJIS.map((emoji) => {
                const emojiReactions = groupedReactions[emoji] || [];
                const count = emojiReactions.length;
                const userHasReacted = emojiReactions.some(r => r.userId === currentUserId);

                return (
                    <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        disabled={isLoading}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                            userHasReacted
                                ? 'bg-nexus-primary text-nexus-tertiary border-2 border-nexus-secondary'
                                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        } disabled:opacity-50`}
                        title={emojiReactions.map(r => r.user.name).join(', ')}
                    >
                        <span className="text-base">{emoji}</span>
                        {count > 0 && (
                            <span className="font-medium text-xs">{count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ReactionButtons;
