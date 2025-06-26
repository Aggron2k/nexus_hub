"use client";

import React from "react";
import { useLanguage } from "@/app/context/LanguageContext";

const ConversationsEmptyState = () => {
    const { language } = useLanguage();

    const translations = {
        en: {
            title: "Select a conversation",
            subtitle: "Choose a conversation from the sidebar to start chatting, or create a new group chat.",
            noConversation: "No conversation selected",
            createNew: "Start a new conversation by clicking the + icon in the sidebar",
        },
        hu: {
            title: "Válassz egy beszélgetést",
            subtitle: "Válassz egy beszélgetést az oldalsávból a csevegés megkezdéséhez, vagy hozz létre egy új csoportos chatet.",
            noConversation: "Nincs kiválasztott beszélgetés",
            createNew: "Kezdj új beszélgetést a + ikonra kattintva az oldalsávban",
        },
    };

    const t = translations[language];

    return (
        <div className="px-4 py-10 sm:px-6 lg:py-8 h-full flex flex-col justify-center items-center bg-gray-50">
            <div className="text-center items-center flex flex-col max-w-lg">
                {/* Chat ikon */}
                <div className="mx-auto w-24 h-24 bg-nexus-primary rounded-full flex items-center justify-center mb-6">
                    <svg
                        className="h-12 w-12 text-nexus-tertiary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>

                {/* Főcím */}
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {t.title}
                </h3>

                {/* Leírás */}
                <p className="text-gray-600 mb-6 text-center leading-relaxed">
                    {t.subtitle}
                </p>

                {/* Segítő szöveg */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 text-center">
                        💡 {t.createNew}
                    </p>
                </div>

                {/* Státusz */}
                <div className="mt-8 text-sm text-gray-400">
                    {t.noConversation}
                </div>
            </div>
        </div>
    );
};

export default ConversationsEmptyState;