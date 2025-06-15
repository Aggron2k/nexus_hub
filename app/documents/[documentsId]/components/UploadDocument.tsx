"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiCloudArrowUp, HiDocumentText } from "react-icons/hi2";

interface UploadDocumentProps {
    userId: string;
    onUploadSuccess?: () => void;
}

const UploadDocument: React.FC<UploadDocumentProps> = ({ userId, onUploadSuccess }) => {
    const [name, setName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { language } = useLanguage();

    const translations = {
        en: {
            uploadDocument: "Upload Document",
            documentName: "Document name",
            selectFile: "Please provide a document name and select a file.",
            uploading: "Uploading...",
            upload: "Upload",
            uploadSuccess: "Document uploaded successfully!",
            uploadError: "Failed to upload document.",
            chooseFile: "Choose file",
            noFileSelected: "No file selected",
        },
        hu: {
            uploadDocument: "Dokumentum feltöltése",
            documentName: "Dokumentum neve",
            selectFile: "Kérjük, adja meg a dokumentum nevét, és válasszon fájlt.",
            uploading: "Feltöltés...",
            upload: "Feltöltés",
            uploadSuccess: "Dokumentum sikeresen feltöltve!",
            uploadError: "Nem sikerült feltölteni a dokumentumot.",
            chooseFile: "Fájl kiválasztása",
            noFileSelected: "Nincs fájl kiválasztva",
        },
    };

    const t = translations[language];

    const handleUpload = async () => {
        if (!file || !name) {
            toast.error(t.selectFile);
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "krkiyocl");
            formData.append("resource_type", "raw");
            formData.append("public_id", name);

            const uploadResponse = await axios.post(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
                formData
            );

            const fileUrl = uploadResponse.data.secure_url;

            await axios.post("/api/documents", {
                userId,
                name,
                fileType: file.type,
                fileUrl,
            });

            setName("");
            setFile(null);

            if (onUploadSuccess) {
                onUploadSuccess();
            }
        } catch (error) {
            console.error("Error during file upload:", error);
            toast.error(t.uploadError);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-nexus-primary rounded-lg">
                    <HiCloudArrowUp className="h-6 w-6 text-nexus-tertiary" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{t.uploadDocument}</h2>
            </div>

            <div className="space-y-4">
                {/* Document Name Input */}
                <div>
                    <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 mb-2">
                        {t.documentName}
                    </label>
                    <input
                        id="documentName"
                        type="text"
                        placeholder={t.documentName}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-nexus-secondary focus:border-nexus-secondary transition-colors"
                        disabled={isUploading}
                    />
                </div>

                {/* File Input */}
                <div>
                    <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-2">
                        {t.chooseFile}
                    </label>
                    <div className="relative">
                        <input
                            id="fileInput"
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="sr-only"
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="fileInput"
                            className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-nexus-secondary focus-within:border-nexus-secondary transition-colors"
                        >
                            <HiDocumentText className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                                {file ? file.name : t.noFileSelected}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={isUploading || !file || !name}
                    className="w-full flex items-center justify-center px-4 py-3 bg-nexus-tertiary text-white font-medium rounded-md hover:bg-nexus-secondary focus:outline-none focus:ring-2 focus:ring-nexus-secondary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isUploading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t.uploading}
                        </>
                    ) : (
                        <>
                            <HiCloudArrowUp className="h-5 w-5 mr-2" />
                            {t.upload}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default UploadDocument;