"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";
import { MessageType } from "@prisma/client";
import { HiPlus, HiChatBubbleLeftRight } from "react-icons/hi2";
import CreateMessageModal from "./components/CreateMessageModal";
import MessageFilters from "./components/MessageFilters";
import MessageList from "./components/MessageList";
import LoadingModal from "../components/LoadingModal";

export default function MessagesPage() {
    const { language } = useLanguage();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter states
    const [selectedType, setSelectedType] = useState<MessageType | "ALL">("ALL");
    const [showPinnedOnly, setShowPinnedOnly] = useState(false);
    const [showOnlyMine, setShowOnlyMine] = useState(false);

    const translations = {
        en: {
            title: "Message Board",
            newMessage: "New Message",
            loading: "Loading..."
        },
        hu: {
            title: "Üzenőfal",
            newMessage: "Új üzenet",
            loading: "Betöltés..."
        }
    };

    const t = translations[language];

    // Fetch current user and messages
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [userRes, messagesRes] = await Promise.all([
                    axios.get('/api/users/me'),
                    axios.get('/api/messages')
                ]);
                setCurrentUser(userRes.data);
                setMessages(messagesRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = [...messages];

        // Type filter
        if (selectedType !== "ALL") {
            filtered = filtered.filter(m => m.type === selectedType);
        }

        // Pinned filter
        if (showPinnedOnly) {
            filtered = filtered.filter(m => m.isPinned);
        }

        // Only mine filter
        if (showOnlyMine && currentUser) {
            filtered = filtered.filter(m => m.authorId === currentUser.id);
        }

        setFilteredMessages(filtered);
    }, [messages, selectedType, showPinnedOnly, showOnlyMine, currentUser]);

    const handleRefresh = async () => {
        try {
            const response = await axios.get('/api/messages');
            setMessages(response.data);
        } catch (error) {
            console.error('Error refreshing messages:', error);
        }
    };

    if (isLoading) {
        return <LoadingModal />;
    }

    return (
        <>
            {/* Mobile View */}
            <div className="block lg:hidden h-full bg-nexus-bg overflow-y-auto pb-20">
                {/* Mobile Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-nexus-primary rounded-lg">
                                <HiChatBubbleLeftRight className="h-6 w-6 text-nexus-tertiary" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-nexus-secondary hover:text-white transition-colors"
                        >
                            <HiPlus className="h-5 w-5" />
                            <span className="text-sm font-medium">{t.newMessage}</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    <MessageFilters
                        selectedType={selectedType}
                        onTypeChange={setSelectedType}
                        showPinnedOnly={showPinnedOnly}
                        onPinnedToggle={() => setShowPinnedOnly(!showPinnedOnly)}
                        showOnlyMine={showOnlyMine}
                        onOnlyMineToggle={() => setShowOnlyMine(!showOnlyMine)}
                    />

                    {currentUser && (
                        <MessageList
                            messages={filteredMessages}
                            currentUserId={currentUser.id}
                            currentUserRole={currentUser.role}
                            onUpdate={handleRefresh}
                        />
                    )}
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block lg:pl-80 h-full">
                <div className="h-full bg-nexus-bg">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-nexus-primary rounded-lg">
                                    <HiChatBubbleLeftRight className="h-6 w-6 text-nexus-tertiary" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-nexus-secondary hover:text-white transition-colors"
                            >
                                <HiPlus className="h-5 w-5" />
                                <span className="font-medium">{t.newMessage}</span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto h-[calc(100%-73px)]">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <MessageFilters
                                selectedType={selectedType}
                                onTypeChange={setSelectedType}
                                showPinnedOnly={showPinnedOnly}
                                onPinnedToggle={() => setShowPinnedOnly(!showPinnedOnly)}
                                showOnlyMine={showOnlyMine}
                                onOnlyMineToggle={() => setShowOnlyMine(!showOnlyMine)}
                            />

                            {currentUser && (
                                <MessageList
                                    messages={filteredMessages}
                                    currentUserId={currentUser.id}
                                    currentUserRole={currentUser.role}
                                    onUpdate={handleRefresh}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Message Modal */}
            <CreateMessageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
