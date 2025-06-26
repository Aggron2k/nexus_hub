"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { useLanguage } from "@/app/context/LanguageContext";
import { pusherClient } from "@/app/libs/pusher";
import { FullDocumentType } from "@/app/types";
import { HiDocumentText, HiEye, HiXMark, HiCalendar } from "react-icons/hi2";

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

interface UserDocumentsProps {
    userId: string;
}

const UserDocuments: React.FC<UserDocumentsProps> = ({ userId }) => {
    const [documents, setDocuments] = useState<FullDocumentType[]>([]);
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
            uploadedOn: "Uploaded on",
        },
        hu: {
            documents: "Dokumentumok",
            noDocuments: "Még nincsenek feltöltött dokumentumok.",
            loading: "Dokumentumok betöltése...",
            failedToLoad: "Nem sikerült betölteni a dokumentumokat.",
            view: "Megtekintés",
            previewDocument: "Dokumentum előnézete",
            close: "Bezárás",
            uploadedOn: "Feltöltve",
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

        // Pusher feliratkozás
        const channel = pusherClient.subscribe(`user-${userId}-documents`);

        // Új dokumentum kezelése
        const newDocumentHandler = (document: FullDocumentType) => {
            setDocuments((current) => {
                const exists = current.some((doc) => doc.id === document.id);
                if (exists) {
                    return current;
                }
                const updatedDocuments = [...current, document].sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                return updatedDocuments;
            });
        };

        // Esemény kötések
        channel.bind('document:new', newDocumentHandler);

        channel.bind('pusher:subscription_succeeded', () => {
            // console.log('Successfully subscribed to channel');
        });

        channel.bind('pusher:subscription_error', (error: any) => {
            // console.error('Subscription error:', error);
        });

        fetchDocuments();

        return () => {
            channel.unbind('document:new', newDocumentHandler);
            pusherClient.unsubscribe(`user-${userId}-documents`);
        };
    }, [userId, t.failedToLoad]);

    const getFileTypeIcon = (fileType: string) => {
        return <HiDocumentText className="h-8 w-8 text-nexus-tertiary" />;
    };

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-nexus-primary rounded-lg">
                        <HiDocumentText className="h-6 w-6 text-nexus-tertiary" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{t.documents}</h2>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-tertiary"></div>
                    <span className="ml-3 text-gray-600">{t.loading}</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-nexus-primary rounded-lg">
                        <HiDocumentText className="h-6 w-6 text-nexus-tertiary" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{t.documents}</h2>
                </div>
                <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-nexus-primary rounded-lg">
                    <HiDocumentText className="h-6 w-6 text-nexus-tertiary" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{t.documents}</h2>
                <span className="bg-nexus-primary text-nexus-tertiary px-2 py-1 rounded-full text-sm font-medium">
                    {documents.length}
                </span>
            </div>

            {/* Documents List */}
            {documents.length === 0 ? (
                <div className="text-center py-12">
                    <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                        <HiDocumentText className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">{t.noDocuments}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                    {getFileTypeIcon(doc.fileType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                        {doc.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        {doc.fileType}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <HiCalendar className="h-3 w-3 text-gray-400" />
                                        <p className="text-xs text-gray-400">
                                            {t.uploadedOn} {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDocument(doc.fileUrl)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-nexus-tertiary bg-nexus-primary hover:bg-nexus-secondary hover:text-white rounded-md transition-colors"
                            >
                                <HiEye className="h-4 w-4" />
                                {t.view}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* PDF Preview Modal */}
            {selectedDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">{t.previewDocument}</h3>
                            <button
                                onClick={() => setSelectedDocument(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <HiXMark className="h-5 w-5" />
                            </button>
                        </div>

                        {/* PDF Viewer */}
                        <div className="flex-1 overflow-hidden">
                            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
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