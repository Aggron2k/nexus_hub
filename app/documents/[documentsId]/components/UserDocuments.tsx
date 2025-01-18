"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const Worker = dynamic(
    () => import("@react-pdf-viewer/core").then((mod) => mod.Worker),
    { ssr: false }
);

const Viewer = dynamic(
    () =>
        import("@react-pdf-viewer/core").then((mod) => mod.Viewer) as Promise<React.ComponentType<{
            fileUrl: string;
            plugins: ReturnType<typeof defaultLayoutPlugin>[];
        }>>,
    { ssr: false }
);

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

    const defaultLayoutPluginInstance = defaultLayoutPlugin(); // Default layout plugin

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
                // Modal Background
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md shadow-lg w-[80vw] h-[80vh] relative">
                        {/* Modal Header */}
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">Preview Document</h3>
                            <button
                                onClick={() => setSelectedDocument(null)}
                                className="text-red-500 hover:text-red-700 font-bold"
                            >
                                X
                            </button>
                        </div>
                        {/* Modal Content */}
                        <div className="h-full w-full">
                            <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
                                <Viewer
                                    fileUrl={selectedDocument}
                                    plugins={[defaultLayoutPluginInstance]}
                                />
                            </Worker>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDocuments;
