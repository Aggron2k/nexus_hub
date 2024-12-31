"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Típusok a kontextushoz
type Language = "en" | "hu";
type LanguageContextType = {
    language: Language;
    toggleLanguage: () => void;
};

// Kontextus létrehozása
const LanguageContext = createContext<LanguageContextType | undefined>(
    undefined
);

// Kontextus Provider komponens
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [language, setLanguage] = useState<Language>("en");

    const toggleLanguage = () => {
        setLanguage((prevLanguage) => (prevLanguage === "en" ? "hu" : "en"));
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Egyedi hook a kontextus használatához
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
