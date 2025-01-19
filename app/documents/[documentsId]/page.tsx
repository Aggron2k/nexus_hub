"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import UploadDocument from "./components/UploadDocument";
import UserDocuments from "./components/UserDocuments";
import Header from "./components/Header"; // Header importálása
import LoadingModal from "@/app/components/LoadingModal"; // LoadingModal importálása
import { toast } from "react-hot-toast"; // Toast importálása

interface User {
    id: string;
    name: string;
    email: string;
}

const DocumentsPage = () => {
    const { documentsId } = useParams() as { documentsId: string }; // Explicit típus a params-hoz
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Loading állapot
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!documentsId) {
            const errorMessage = "User ID is required to view this page.";
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
                const errorMessage = "Failed to fetch user data.";
                setError(errorMessage);
                toast.error(errorMessage); // Toast a hibára
                setLoading(false); // Betöltés vége hiba esetén
            });
    }, [documentsId]);

    const handleDocumentUploadSuccess = () => {
        toast.success("Document uploaded successfully!"); // Siker toast
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
