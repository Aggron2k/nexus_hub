import { create } from "zustand";

/**
 * Online Users Store Interface
 * Manages the list of currently online user IDs
 */
interface OnlineUsersStore {
    /** Array of online user email addresses */
    onlineUserIds: string[];

    /** Add a user to the online list */
    addOnlineUser: (userId: string) => void;

    /** Remove a user from the online list */
    removeOnlineUser: (userId: string) => void;

    /** Set the entire online users list */
    setOnlineUsers: (userIds: string[]) => void;

    /** Clear all online users */
    clearOnlineUsers: () => void;
}

/**
 * useOnlineUsersList - Zustand store for managing online users presence
 * Tracks which users are currently active/online in the application
 */
const useOnlineUsersList = create<OnlineUsersStore>((set) => ({
    onlineUserIds: [],

    addOnlineUser: (userId) => set((state) => ({
        onlineUserIds: [...state.onlineUserIds, userId]
    })),

    removeOnlineUser: (userId) => set((state) => ({
        onlineUserIds: state.onlineUserIds.filter((id) => id !== userId)
    })),

    setOnlineUsers: (userIds) => set({
        onlineUserIds: userIds
    }),

    clearOnlineUsers: () => set({
        onlineUserIds: []
    })
}));

export default useOnlineUsersList;

// Named export for convenience
export { useOnlineUsersList };
