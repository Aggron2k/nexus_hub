"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";

import Button from "@/app/components/Button";
import Modal from "@/app/components/Modal";
import SingleSelect from "./SingleSelect";
import Avatar from "@/app/components/Avatar";

interface NewConversationModalProps {
    isOpen?: boolean;
    onClose: () => void;
    users: User[];
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
    isOpen,
    onClose,
    users,
}) => {
    const router = useRouter();
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserOption, setSelectedUserOption] = useState<{ value: string, label: string } | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const translations = {
        en: {
            title: "Start New Conversation",
            description: "Choose someone to start a private conversation with.",
            selectPerson: "Select Person",
            firstMessage: "First Message (optional)",
            firstMessagePlaceholder: "Type your first message here...",
            cancel: "Cancel",
            startChat: "Start Chat",
            error: "Something went wrong.",
            selectPersonFirst: "Please select a person first.",
            noUsersAvailable: "No users available to chat with.",
            optionalNote: "Optional - you can start the conversation without a message",
            conversationStarted: "Conversation started successfully!",
        },
        hu: {
            title: "Új beszélgetés kezdése",
            description: "Válassz valakit, akivel privát beszélgetést szeretnél kezdeni.",
            selectPerson: "Személy kiválasztása",
            firstMessage: "Első üzenet (opcionális)",
            firstMessagePlaceholder: "Írd ide az első üzeneted...",
            cancel: "Mégse",
            startChat: "Beszélgetés kezdése",
            error: "Valami hiba történt.",
            selectPersonFirst: "Kérlek előbb válassz egy személyt.",
            noUsersAvailable: "Nincs elérhető felhasználó a beszélgetéshez.",
            optionalNote: "Nem kötelező - a beszélgetést üzenet nélkül is elkezdheted",
            conversationStarted: "Beszélgetés sikeresen elkezdve!",
        },
    };

    const t = translations[language];

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FieldValues>({
        defaultValues: {
            message: "",
        },
    });

    const watchedMessage = watch("message");

    // User options for select
    const userOptions = users.map((user) => ({
        value: user.id,
        label: user.name || user.email,
    }));

    const handleUserChange = (selectedOption: { value: string, label: string } | null) => {
        setSelectedUserOption(selectedOption);

        // Keressük meg a teljes User objektumot
        if (selectedOption) {
            const fullUser = users.find(user => user.id === selectedOption.value);
            setSelectedUser(fullUser || null);
        } else {
            setSelectedUser(null);
        }
    };

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
        if (!selectedUser) {
            toast.error(t.selectPersonFirst);
            return;
        }

        setIsLoading(true);

        try { // Debug log

            // Első lépés: Beszélgetés létrehozása
            const conversationResponse = await axios.post("/api/conversations", {
                userId: selectedUser.id,
            });

            const conversationId = conversationResponse.data.id;

            // Második lépés: Ha van üzenet, küldjük el
            if (data.message && data.message.trim()) {
                await axios.post("/api/messages", {
                    message: data.message.trim(),
                    conversationId: conversationId,
                });
            }

            // Átirányítás az új beszélgetésre
            router.push(`/conversations/${conversationId}`);

            // Modal bezárása és form resetelése
            onClose();
            reset();
            setSelectedUserOption(null);
            setSelectedUser(null);

            toast.success(t.conversationStarted);

        } catch (error) {
            console.error("Error creating conversation:", error);
            toast.error(t.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        reset();
        setSelectedUserOption(null);
        setSelectedUser(null);
    };

    if (users.length === 0) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose}>
                <div className="text-center py-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {t.noUsersAvailable}
                    </p>
                    <Button onClick={handleClose} secondary>
                        {t.cancel}
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b border-gray-200 pb-4">
                        <h2 className="text-lg font-semibold leading-6 text-gray-900">
                            {t.title}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            {t.description}
                        </p>
                    </div>

                    {/* User selection */}
                    <div>
                        <SingleSelect
                            disabled={isLoading}
                            label={t.selectPerson}
                            options={userOptions}
                            onChange={handleUserChange}
                            value={selectedUserOption}
                            placeholder={t.selectPerson}
                        />

                        {/* Kiválasztott felhasználó preview */}
                        {selectedUser && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center space-x-3">
                                    {/* Avatar komponens használata */}
                                    <Avatar user={selectedUser} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedUser.name || selectedUser.email}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {selectedUser.email}
                                        </p>
                                        {selectedUser.role && (
                                            <p className="text-xs text-gray-400">
                                                {selectedUser.role}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* First message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.firstMessage}
                        </label>
                        <textarea
                            {...register("message")}
                            disabled={isLoading}
                            rows={3}
                            className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-nexus-tertiary focus:ring-nexus-tertiary sm:text-sm resize-none px-3 py-2 bg-white"
                            placeholder={t.firstMessagePlaceholder}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {t.optionalNote}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-x-3 pt-4 border-t border-gray-200">
                    <Button
                        disabled={isLoading}
                        onClick={handleClose}
                        type="button"
                        secondary
                    >
                        {t.cancel}
                    </Button>
                    <Button
                        disabled={isLoading || !selectedUserOption}
                        type="submit"
                    >
                        {isLoading ? "..." : t.startChat}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default NewConversationModal;