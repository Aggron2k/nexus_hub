// app/documents/[documentsId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import UploadDocument from "./components/UploadDocument";
import UserDocuments from "./components/UserDocuments";
import Header from "./components/Header"; // Header importálása
import LoadingModal from "@/app/components/LoadingModal"; // LoadingModal importálása
import { toast } from "react-hot-toast"; // Toast importálása
import { useLanguage } from "@/app/context/LanguageContext";

interface User {
    id: string;
    name: string;
    email: string;
}

const DocumentsPage = () => {
    const router = useRouter();
    const { language } = useLanguage();
    const { documentsId } = useParams() as { documentsId: string }; // Explicit típus a params-hoz
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Loading állapot
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!documentsId) {
            const errorMessage = language === 'hu' ? 'Felhasználói azonosító szükséges az oldal megtekintéséhez.' : 'User ID is required to view this page.';
            setError(errorMessage);
            toast.error(errorMessage); // Toast a hibára
            setLoading(false); // Betöltés vége hiba esetén
            return;
        }

        // Felhasználó adatok lekérése az API-ból
        axios
            .get(`/api/users/${documentsId}`)
            .then((response) => {
                setUser(response.data);
                setLoading(false); // Betöltés vége
            })
            .catch((error) => {
                console.error("Error fetching user data:", error);

                // Ha 403 Forbidden, akkor átirányítjuk a saját profiljára
                if (error.response?.status === 403) {
                    toast.error(language === 'hu' ? 'Csak a saját dokumentumaidat tekintheted meg' : 'You can only view your own documents');
                    // Lekérjük a saját user ID-t és átirányítjuk
                    axios.get('/api/users/me')
                        .then((meResponse) => {
                            router.push(`/documents/${meResponse.data.id}`);
                        })
                        .catch(() => {
                            router.push('/documents');
                        });
                    return;
                }

                const errorMessage = language === 'hu' ? 'Felhasználói adatok betöltése sikertelen.' : 'Failed to fetch user data.';
                setError(errorMessage);
                toast.error(errorMessage); // Toast a hibára
                setLoading(false); // Betöltés vége hiba esetén
            });
    }, [documentsId, router, language]);

    const handleDocumentUploadSuccess = () => {
        toast.success(language === 'hu' ? 'Dokumentum sikeresen feltöltve!' : 'Document uploaded successfully!'); // Siker toast
    };

    if (loading) return <LoadingModal />; // LoadingModal megjelenítése
    if (error) return <p>{error}</p>;

    return (
        <div className="lg:pl-80 h-full">
            <div className="h-full flex flex-col">
                <Header user={user!} documentsId={documentsId} />
                <UploadDocument userId={documentsId} onUploadSuccess={handleDocumentUploadSuccess} />
                <UserDocuments userId={documentsId} />
            </div>
        </div>
    );
};

export default DocumentsPage;
