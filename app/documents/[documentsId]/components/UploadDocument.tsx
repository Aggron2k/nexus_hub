"use client";

import { useState } from "react";
import axios from "axios";

interface UploadDocumentProps {
    userId: string;
}

const UploadDocument: React.FC<UploadDocumentProps> = ({ userId }) => {
    const [name, setName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        if (!file || !name) {
            alert("Please provide a document name and select a file.");
            return;
        }

        setIsUploading(true);

        try {
            // Feltöltés a Cloudinary-hoz
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "krkiyocl");

            const uploadResponse = await axios.post(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
                formData
            );

            const fileUrl = uploadResponse.data.secure_url;

            // Dokumentum mentése az adatbázisba
            await axios.post("/api/documents", {
                userId,
                name,
                fileType: file.type,
                fileUrl,
            });

            alert("Document uploaded successfully.");
            setName("");
            setFile(null);
        } catch (error) {
            console.error("Error during file upload:", error);
            alert("Failed to upload document.");
        } finally {
            setIsUploading(false);
        }
    };



    return (
        <div className="border p-4 rounded-md">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            <input
                type="text"
                placeholder="Document name"
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
                {isUploading ? "Uploading..." : "Upload"}
            </button>
        </div>
    );
};

export default UploadDocument;
