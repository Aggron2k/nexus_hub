import { useState, useEffect, useCallback } from 'react';
import { User, Position } from '@prisma/client';

interface UserWithPosition extends User {
    position?: Position;
}

interface UpdateUserData {
    name: string;
    email: string;
    role?: string;
    positionId: string;
    image: string;
}

export const useUserProfile = (userId?: string) => {
    const [user, setUser] = useState<UserWithPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/users/${id}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch user');
            }

            const userData = await response.json();
            setUser(userData);
            return userData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = useCallback(async (id: string, data: UpdateUserData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update user');
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            return updatedUser;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            fetchUser(userId);
        }
    }, [userId, fetchUser]);

    return {
        user,
        loading,
        error,
        fetchUser,
        updateUser,
        refetch: () => userId && fetchUser(userId)
    };
};