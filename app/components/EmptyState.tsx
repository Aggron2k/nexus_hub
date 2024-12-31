"use client";

import React from "react";
import { useLanguage } from "@/app/context/LanguageContext";

const EmptyState = () => {
    const { language } = useLanguage();

    const translations = {
        en: "Click an item from the sidebar!",
        hu: "Kattints az oldalsó sávból egy elemre!",
    };

    return (
        <div className="px-4 py-10 sm:px-6 lg:py-8 h-full flex flex-col justify-center items-center bg-gray-100">
            <div className="text-center items-center flex flex-col">
                <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                    {translations[language]}
                </h3>
            </div>
        </div>
    );
};

export default EmptyState;
