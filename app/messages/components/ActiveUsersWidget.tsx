"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { HiUsers } from "react-icons/hi2";
import useActiveList from "@/app/hooks/useActiveList";
import Avatar from "@/app/components/Avatar";
import { useEffect, useState } from "react";
import axios from "axios";

const ActiveUsersWidget = () => {
    const { language } = useLanguage();
    const { members } = useActiveList(); // Online users emails
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const translations = {
        en: {
            title: "Active Users",
            noOne: "No one is online",
            online: "online"
        },
        hu: {
            title: "Aktív felhasználók",
            noOne: "Senki sincs online",
            online: "online"
        }
    };

    const t = translations[language];

    // Fetch all users and filter by online status
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('/api/users');

                // Filter users who are online (their email is in members array)
                const activeUsers = response.data.filter((user: any) =>
                    members.includes(user.email)
                );

                // Limit to 7 users
                setOnlineUsers(activeUsers.slice(0, 7));
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (members.length > 0) {
            fetchUsers();
        } else {
            setOnlineUsers([]);
            setIsLoading(false);
        }
    }, [members]);

    return (
        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <HiUsers className="h-5 w-5 text-nexus-tertiary" />
                <h3 className="text-sm font-semibold text-gray-700">{t.title}</h3>
                {onlineUsers.length > 0 && (
                    <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {onlineUsers.length} {t.online}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-nexus-tertiary"></div>
                </div>
            ) : onlineUsers.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-xs text-gray-500">{t.noOne}</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {onlineUsers.map((user) => (
                        <div
                            key={user.id}
                            className="group relative"
                            title={user.name || user.email}
                        >
                            <Avatar user={user} />

                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {user.name || user.email}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActiveUsersWidget;
