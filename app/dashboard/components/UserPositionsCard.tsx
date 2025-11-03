"use client";

import { User } from "@prisma/client";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiBriefcase, HiStar } from "react-icons/hi2";

interface UserPositionsCardProps {
    user: User | null;
}

const UserPositionsCard: React.FC<UserPositionsCardProps> = ({ user }) => {
    const { language } = useLanguage();

    const translations = {
        en: {
            title: "My Positions",
            primary: "Primary",
            noPositions: "No positions assigned",
            assignedOn: "Assigned on"
        },
        hu: {
            title: "Pozícióim",
            primary: "Elsődleges",
            noPositions: "Nincs hozzárendelt pozíció",
            assignedOn: "Hozzárendelve"
        }
    };

    const t = translations[language];

    if (!user) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">{language === 'hu' ? 'Betöltés...' : 'Loading...'}</p>
            </div>
        );
    }

    // @ts-ignore - userPositions include-olva van a user lekérdezésben
    const userPositions = user.userPositions || [];

    return (
        <div className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-nexus-primary rounded-lg">
                    <HiBriefcase className="h-5 w-5 text-nexus-tertiary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
            </div>

            {/* Positions List */}
            {userPositions.length > 0 ? (
                <div className="space-y-3">
                    {userPositions.map((userPos: any) => (
                        <div
                            key={userPos.id}
                            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            style={{ borderLeftColor: userPos.position.color, borderLeftWidth: '4px' }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {userPos.position.displayNames?.[language] || userPos.position.name}
                                        </p>
                                        {userPos.isPrimary && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                                <HiStar className="h-3 w-3" />
                                                {t.primary}
                                            </span>
                                        )}
                                    </div>
                                    {userPos.position.descriptions?.[language] && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {userPos.position.descriptions[language]}
                                        </p>
                                    )}
                                    {userPos.assignedAt && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            {t.assignedOn}: {new Date(userPos.assignedAt).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <HiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">{t.noPositions}</p>
                </div>
            )}
        </div>
    );
};

export default UserPositionsCard;
