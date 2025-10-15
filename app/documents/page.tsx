// app/documents/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import EmptyState from "../components/EmptyState";

const Documents = () => {
    const router = useRouter();

    useEffect(() => {
        // Lekérjük a bejelentkezett felhasználót
        axios.get('/api/users/me')
            .then((response) => {
                const currentUser = response.data;
                // Ha Employee, automatikusan átirányítjuk a saját dokumentumaihoz
                if (currentUser.role === 'Employee') {
                    router.push(`/documents/${currentUser.id}`);
                }
            })
            .catch((error) => {
                console.error('Error fetching current user:', error);
            });
    }, [router]);

    return (
        <div className="hidden lg:block lg:pl-80 h-full">
            <EmptyState />
        </div>
    );
}

export default Documents;