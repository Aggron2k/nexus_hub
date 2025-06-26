"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { User } from "@prisma/client";

const Users = () => {
    const { language } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debug: Felhasználók lekérése
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Fetched users:', data); // Debug log
                setUsers(data);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Fordítások
    const translations = {
        en: {
            title: "Select a person",
            subtitle: "Choose someone from the list to start a conversation.",
            noSelection: "No person selected",
            loading: "Loading users...",
            error: "Error loading users",
        },
        hu: {
            title: "Válassz egy személyt",
            subtitle: "Válassz valakit a listából, hogy elkezdhess vele beszélgetni.",
            noSelection: "Nincs kiválasztott személy",
            loading: "Felhasználók betöltése...",
            error: "Hiba a felhasználók betöltésekor",
        },
    };

    const t = translations[language];

    // Loading state
    if (loading) {
        return (
            <div className="hidden lg:block lg:pl-80 h-full">
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-tertiary mb-4"></div>
                    <p className="text-gray-600">{t.loading}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="hidden lg:block lg:pl-80 h-full">
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="text-red-500 mb-4">
                        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.error}</h3>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    // Debug: Users lista
    console.log('Current users state:', users);

    return (
        <div className="hidden lg:block lg:pl-80 h-full">
            <div className="h-full flex flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="text-center">
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
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {t.title}
                    </h3>

                    <p className="text-gray-600 max-w-sm mx-auto mb-4">
                        {t.subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Users;