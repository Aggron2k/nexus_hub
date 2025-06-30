import { useState, useEffect } from 'react';

interface Position {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    color: string;
    order: number;
    _count?: {
        users: number;
    };
}

export const usePositions = () => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPositions = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/positions');

                if (!response.ok) {
                    throw new Error('Failed to fetch positions');
                }

                const positionsData = await response.json();
                setPositions(positionsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchPositions();
    }, []);

    return {
        positions,
        loading,
        error
    };
};