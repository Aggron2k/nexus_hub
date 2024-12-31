"use client";

import React from "react";
import { useLanguage } from "@/app/context/LanguageContext";

const EmptyState = () => {
    const { language, toggleLanguage } = useLanguage();

    const translations = {
        en: "Welcome to the Nexus HUB application!",
        hu: "Üdvözöllek a Nexus HUB alkalmazásban!",
    };

    return (
        <div className="px-4 py-10 sm:px-6 lg:py-8 h-full flex flex-col justify-center items-center bg-gray-100">
            <div className="text-center items-center flex flex-col">
                <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                    {translations[language]}
                </h3>
                <button
                    onClick={toggleLanguage}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition"
                >
                    {language === "en" ? "Switch to Hungarian" : "Váltás angolra"}
                </button>
            </div>
        </div>
    );
};

export default EmptyState;
