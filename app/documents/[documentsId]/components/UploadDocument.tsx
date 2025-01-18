"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/context/LanguageContext";

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
        },
        hu: {
            uploadDocument: "Dokumentum feltöltése",
            documentName: "Dokumentum neve",
            selectFile: "Kérjük, adja meg a dokumentum nevét, és válasszon fájlt.",
            uploading: "Feltöltés...",
            upload: "Feltöltés",
            uploadSuccess: "Dokumentum sikeresen feltöltve!",
            uploadError: "Nem sikerült feltölteni a dokumentumot.",
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

            toast.success(t.uploadSuccess);
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
        <div className="border p-4 rounded-md">
            <h2 className="text-xl font-bold mb-4">{t.uploadDocument}</h2>
            <input
                type="text"
                placeholder={t.documentName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-2 p-2 border rounded w-full"
            />
            <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mb-2 p-2 border rounded w-full"
            />
            <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
                {isUploading ? t.uploading : t.upload}
            </button>
        </div>
    );
};

export default UploadDocument;
