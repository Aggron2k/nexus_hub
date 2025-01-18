"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import PDFViewer from "./PDFViewer";

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
    const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

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
        <div className="border p-4 rounded-md">
            <h2 className="text-xl font-bold mb-4">Documents</h2>
            {documents.length === 0 ? (
                <p>No documents uploaded yet.</p>
            ) : (
                <ul className="space-y-2">
                    {documents.map((doc) => (
                        <li
                            key={doc.id}
                            className="flex justify-between items-center border-b py-2"
                        >
                            <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-sm text-gray-500">{doc.fileType}</p>
                            </div>
                            <button
                                onClick={() => setSelectedDocument(doc.fileUrl)}
                                className="text-blue-500 hover:underline"
                            >
                                View
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {selectedDocument && (
                <div className="mt-4 border p-4 rounded-md">
                    <h3 className="text-lg font-bold mb-2">Preview Document</h3>
                    <div className="h-96 w-full overflow-hidden">
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
                            <Viewer fileUrl={selectedDocument} />
                        </Worker>
                    </div>
                    <button
                        onClick={() => setSelectedDocument(null)}
                        className="mt-4 text-white bg-red-500 px-4 py-2 rounded hover:bg-red-600"
                    >
                        Close Preview
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserDocuments;
