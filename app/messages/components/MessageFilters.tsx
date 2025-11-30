"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { MessageType } from "@prisma/client";

interface MessageFiltersProps {
    selectedType: MessageType | "ALL";
    onTypeChange: (type: MessageType | "ALL") => void;
    showPinnedOnly: boolean;
    onPinnedToggle: () => void;
    showOnlyMine: boolean;
    onOnlyMineToggle: () => void;
}

const MessageFilters: React.FC<MessageFiltersProps> = ({
    selectedType,
    onTypeChange,
    showPinnedOnly,
    onPinnedToggle,
    showOnlyMine,
    onOnlyMineToggle
}) => {
    const { language } = useLanguage();

    const translations = {
        en: {
            all: "All",
            pinnedOnly: "Pinned Only",
            myMessages: "My Messages",
            types: {
                ANNOUNCEMENT: "📢 Announcement",
                NEWS: "📰 News",
                QUESTION: "❓ Question",
                IDEA: "💡 Idea",
                BIRTHDAY: "🎂 Birthday"
            }
        },
        hu: {
            all: "Összes",
            pinnedOnly: "Csak rögzítettek",
            myMessages: "Saját üzenetek",
            types: {
                ANNOUNCEMENT: "📢 Bejelentés",
                NEWS: "📰 Hírek",
                QUESTION: "❓ Kérdés",
                IDEA: "💡 Ötlet",
                BIRTHDAY: "🎂 Születésnap"
            }
        }
    };

    const t = translations[language];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="space-y-4">
                {/* Category filters */}
                <div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => onTypeChange("ALL")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                selectedType === "ALL"
                                    ? 'bg-nexus-primary text-nexus-tertiary'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {t.all}
                        </button>
                        {Object.values(MessageType).map((type) => (
                            <button
                                key={type}
                                onClick={() => onTypeChange(type)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    selectedType === type
                                        ? 'bg-nexus-primary text-nexus-tertiary'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {t.types[type]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toggle filters */}
                <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showPinnedOnly}
                            onChange={onPinnedToggle}
                            className="w-4 h-4 text-nexus-primary rounded border-gray-300 focus:ring-nexus-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">{t.pinnedOnly}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnlyMine}
                            onChange={onOnlyMineToggle}
                            className="w-4 h-4 text-nexus-primary rounded border-gray-300 focus:ring-nexus-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">{t.myMessages}</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default MessageFilters;
