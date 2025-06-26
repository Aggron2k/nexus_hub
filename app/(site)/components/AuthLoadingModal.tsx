'use client';

import { useLanguage } from "@/app/context/LanguageContext";

interface AuthLoadingModalProps {
    isVisible: boolean;
}

const AuthLoadingModal: React.FC<AuthLoadingModalProps> = ({ isVisible }) => {
    const { language } = useLanguage();

    const translations = {
        en: {
            loggingIn: "Logging in...",
            pleaseWait: "Please wait while we log you in",
            socialLogin: "Connecting with social account...",
        },
        hu: {
            loggingIn: "Bejelentkezés...",
            pleaseWait: "Kérlek várj, amíg bejelentkeztetünk",
            socialLogin: "Kapcsolódás a közösségi fiókkal...",
        },
    };

    const t = translations[language];

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Háttér overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50" />

            {/* Loading modal */}
            <div className="relative bg-white rounded-lg p-8 shadow-xl max-w-md w-full mx-4">
                <div className="text-center">
                    {/* Spinner animáció */}
                    <div className="mx-auto mb-4 w-16 h-16 border-4 border-nexus-tertiary border-t-transparent rounded-full animate-spin"></div>

                    {/* Cím */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t.loggingIn}
                    </h3>

                    {/* Leírás */}
                    <p className="text-gray-600">
                        {t.pleaseWait}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthLoadingModal;