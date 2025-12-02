"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";
import { MessageType } from "@prisma/client";
import { HiPhoto } from "react-icons/hi2";
import { HiX } from "react-icons/hi";
import { CldUploadWidget } from "next-cloudinary";

interface CreateMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CloudinaryUploadWidgetInfo {
    secure_url: string;
}

const CreateMessageModal: React.FC<CreateMessageModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "NEWS" as MessageType,
        imageUrl: ""
    });

    const translations = {
        en: {
            createMessage: "Create Message",
            title: "Title (optional)",
            content: "Message",
            type: "Category",
            uploadImage: "Upload Image",
            removeImage: "Remove Image",
            cancel: "Cancel",
            post: "Post",
            types: {
                ANNOUNCEMENT: "Announcement",
                NEWS: "News",
                QUESTION: "Question",
                IDEA: "Idea",
                BIRTHDAY: "Birthday"
            }
        },
        hu: {
            createMessage: "Üzenet létrehozása",
            title: "Cím (opcionális)",
            content: "Üzenet",
            type: "Kategória",
            uploadImage: "Kép feltöltése",
            removeImage: "Kép eltávolítása",
            cancel: "Mégse",
            post: "Küldés",
            types: {
                ANNOUNCEMENT: "Bejelentés",
                NEWS: "Hírek",
                QUESTION: "Kérdés",
                IDEA: "Ötlet",
                BIRTHDAY: "Születésnap"
            }
        }
    };

    const t = translations[language];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.content.trim()) {
            toast.error(language === 'hu' ? 'Az üzenet szövege kötelező' : 'Message content is required');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post('/api/messages', {
                title: formData.title.trim() || null,
                content: formData.content.trim(),
                type: formData.type,
                imageUrl: formData.imageUrl || null
            });

            toast.success(language === 'hu' ? 'Üzenet létrehozva!' : 'Message created!');
            setFormData({ title: "", content: "", type: "NEWS", imageUrl: "" });
            onClose();
            router.refresh();
        } catch (error) {
            console.error('Error creating message:', error);
            toast.error(language === 'hu' ? 'Hiba történt' : 'Error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
                    <h2 className="text-xl font-semibold text-gray-900">{t.createMessage}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <HiX className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.type}
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as MessageType })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary"
                        >
                            {Object.values(MessageType).map((type) => (
                                <option key={type} value={type}>
                                    {t.types[type]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.title}
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary"
                            placeholder={t.title}
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.content} *
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary focus:border-nexus-primary resize-none"
                            placeholder={t.content}
                            required
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.uploadImage}
                        </label>

                        {formData.imageUrl ? (
                            <div className="relative">
                                <img
                                    src={formData.imageUrl}
                                    alt="Upload preview"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                    className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                                >
                                    {t.removeImage}
                                </button>
                            </div>
                        ) : (
                            <CldUploadWidget
                                uploadPreset="krkiyocl"
                                options={{
                                    maxFiles: 1,
                                    maxFileSize: 5000000, // 5MB
                                    sources: ['local', 'url', 'camera'],
                                    resourceType: 'image'
                                }}
                                onSuccess={(result: any) => {
                                    if (result?.info && typeof result.info !== 'string' && result.info.secure_url) {
                                        setFormData({ ...formData, imageUrl: result.info.secure_url });
                                    }
                                }}
                            >
                                {({ open }) => (
                                    <button
                                        type="button"
                                        onClick={() => open()}
                                        className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-nexus-primary transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-nexus-primary"
                                    >
                                        <HiPhoto className="h-8 w-8" />
                                        <span className="text-sm">{t.uploadImage}</span>
                                        <span className="text-xs">(Max 5MB)</span>
                                    </button>
                                )}
                            </CldUploadWidget>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !formData.content.trim()}
                            className="px-4 py-2 bg-nexus-primary text-nexus-tertiary rounded-lg hover:bg-nexus-secondary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (language === 'hu' ? 'Küldés...' : 'Posting...') : t.post}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMessageModal;
