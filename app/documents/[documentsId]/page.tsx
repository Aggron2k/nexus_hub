"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import UploadDocument from "./components/UploadDocument";
import UserDocuments from "./components/UserDocuments";

interface User {
    id: string;
    name: string;
    email: string;
}

const DocumentsPage = () => {
    const { documentsId } = useParams() as { documentsId: string }; // Explicit típus a params-hoz
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!documentsId) {
            setError("User ID is required to view this page.");
            return;
        }

        // Felhasználó adatok lekérése az API-ból
        axios
            .get(`/api/users/${documentsId}`)
            .then((response) => setUser(response.data))
            .catch((error) => {
                console.error("Error fetching user data:", error);
                setError("Failed to fetch user data.");
            });
    }, [documentsId]);

    if (error) return <p>{error}</p>;
    if (!user) return <p>Loading...</p>;

    return (
        <div className="lg:pl-80 h-full">
            <div className="h-full flex flex-col">
                {/* Felhasználó adatai */}
                <h1 className="text-2xl font-bold">{user.name}'s Documents</h1>
                <p>Email: {user.email}</p>

                {/* Feltöltési funkció */}
                <UploadDocument userId={documentsId} />

                {/* Dokumentumok listázása */}
                <UserDocuments userId={documentsId} />
            </div>
        </div>
    );
};

export default DocumentsPage;
