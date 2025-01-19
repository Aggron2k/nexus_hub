// hooks/useDocumentNavigation.ts
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const useDocumentNavigation = () => {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    const navigateToDocuments = () => {
        setIsNavigating(true);
        router.push('/documents');
    };

    const navigateToUserDocuments = (userId: string) => {
        setIsNavigating(true);
        router.push(`/documents/${userId}`);
    };

    return {
        navigateToDocuments,
        navigateToUserDocuments,
        isNavigating
    };
};