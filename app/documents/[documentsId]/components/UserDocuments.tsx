"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface UserDocumentsProps {
    userId: string;
}

const UserDocuments: React.FC<UserDocumentsProps> = ({ userId }) => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchDocuments = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/api/documents?userId=${userId}`);
                setDocuments(response.data);
            } catch (error) {
                console.error(error);
                alert("Failed to load documents.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, [userId]);

    return (
        <div className="border p-4 rounded-md">
            <h2 className="text-xl font-bold mb-4">Documents</h2>
            {isLoading ? (
                <p>Loading documents...</p>
            ) : (
                <ul className="space-y-2">
                    {documents.map((doc: any) => (
                        <li key={doc.id} className="flex justify-between items-center">
                            <span>{doc.name}</span>
                            <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
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
