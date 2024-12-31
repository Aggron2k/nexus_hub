"use client";

import React from "react";
import { useLanguage } from "@/app/context/LanguageContext";

const LanguageSwitcher: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="rounded bg-nexus-primary text-white p-2 hover:bg-nexus-secondary"
        >
            {language === "en" ? "Switch to Hungarian" : "Switch to English"}
        </button>
    );
};

export default LanguageSwitcher;
