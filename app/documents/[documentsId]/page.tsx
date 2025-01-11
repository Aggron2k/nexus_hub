"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import UploadDocument from "./components/UploadDocument";
import UserDocuments from "./components/UserDocuments";

const DocumentsPage = () => {
    const { documentsId } = useParams(); // Az adott felhasználó ID-jét tartalmazza
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        // Felhasználó adatok lekérése az API-ból
        axios.get(`/api/users/${documentsId}`)
            .then((response) => setUser(response.data))
            .catch((error) => {
                console.error("Error fetching user data:", error);
                setError("Failed to fetch user data.");
            });
    }, [documentsId]);

    if (!documentsId) {
        return <div>User ID is required to view this page.</div>;
    }

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
