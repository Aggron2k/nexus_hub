"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Document {
    id: string;
    name: string;
    fileUrl: string;
    fileType: string;
}

interface UserDocumentsProps {
    userId: string;
}

const UserDocuments: React.FC<UserDocumentsProps> = ({ userId }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDocuments = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/api/documents?userId=${userId}`);
                setDocuments(response.data);
            } catch (error) {
                console.error("Error loading documents:", error);
                setError("Failed to load documents.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, [userId]);

    if (isLoading) {
        return <p>Loading documents...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div className="border p-6 rounded-lg bg-white shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Uploaded Documents</h2>
            {documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded yet.</p>
            ) : (
                <ul className="space-y-4">
                    {documents.map((doc) => (
                        <li
                            key={doc.id}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-md shadow-sm"
                        >
                            <div>
                                <p className="font-semibold text-gray-700">{doc.name}</p>
                                <p className="text-sm text-gray-500">{doc.fileType}</p>
                            </div>
                            <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                View
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>

    );
};

export default UserDocuments;
