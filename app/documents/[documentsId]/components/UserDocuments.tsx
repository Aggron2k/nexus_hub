"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { useLanguage } from "@/app/context/LanguageContext";

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

    const { language } = useLanguage();

    const translations = {
        en: {
            documents: "Documents",
            noDocuments: "No documents uploaded yet.",
            loading: "Loading documents...",
            failedToLoad: "Failed to load documents.",
            view: "View",
            previewDocument: "Preview Document",
            close: "Close",
        },
        hu: {
            documents: "Dokumentumok",
            noDocuments: "Még nincsenek feltöltött dokumentumok.",
            loading: "Dokumentumok betöltése...",
            failedToLoad: "Nem sikerült betölteni a dokumentumokat.",
            view: "Megtekintés",
            previewDocument: "Dokumentum előnézete",
            close: "Bezárás",
        },
    };

    const t = translations[language];
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    useEffect(() => {
        const fetchDocuments = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/api/documents?userId=${userId}`);
                setDocuments(response.data);
            } catch (error) {
                console.error("Error loading documents:", error);
                setError(t.failedToLoad);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, [userId, t.failedToLoad]);

    if (isLoading) {
        return <p>{t.loading}</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div className="border p-4 rounded-md">
            <h2 className="text-xl font-bold mb-4">{t.documents}</h2>
            {documents.length === 0 ? (
                <p>{t.noDocuments}</p>
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
                                {t.view}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {selectedDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md shadow-lg w-[80vw] h-[80vh] relative">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">{t.previewDocument}</h3>
                            <button
                                onClick={() => setSelectedDocument(null)}
                                className="text-red-500 hover:text-red-700 font-bold"
                            >
                                {t.close}
                            </button>
                        </div>
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
