"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface UploadDocumentProps {
    userId: string;
    onUploadSuccess?: () => void;
}

const UploadDocument: React.FC<UploadDocumentProps> = ({ userId, onUploadSuccess }) => {
    const [name, setName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        if (!file || !name) {
            toast.error("Please provide a document name and select a file."); // Hibaüzenet toast
            return;
        }

        setIsUploading(true);

        try {
            // File upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "krkiyocl");
            formData.append("resource_type", "raw"); // Specify raw for raw files
            formData.append("public_id", name); // Set the name of the file as the public ID

            const uploadResponse = await axios.post(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
                formData
            );

            const fileUrl = uploadResponse.data.secure_url;

            // Save the document information to the database
            await axios.post("/api/documents", {
                userId,
                name,
                fileType: file.type,
                fileUrl,
            });

            //toast.success("Document uploaded successfully!"); // Sikeres toast
            setName("");
            setFile(null);

            if (onUploadSuccess) {
                onUploadSuccess(); // Siker callback hívása
            }
        } catch (error) {
            console.error("Error during file upload:", error);
            toast.error("Failed to upload document."); // Hiba toast
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
