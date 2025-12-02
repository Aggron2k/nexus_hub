import { User } from "@prisma/client";

/**
 * Check if a user is currently online based on their email
 * @param userEmail - The email address of the user to check
 * @param onlineUsers - Array of online user email addresses
 * @returns True if user is online, false otherwise
 */
export const checkUserOnlineStatus = (
    userEmail: string | undefined | null,
    onlineUsers: string[]
): boolean => {
    if (!userEmail) return false;
    return onlineUsers.includes(userEmail);
};

/**
 * Get user initials for fallback avatar display
 * @param user - User object containing name information
 * @returns Initials string (up to 2 characters)
 */
export const getUserInitials = (user?: User | null): string => {
    if (!user?.name) return "U";

    const names = user.name.split(" ");
    if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
};

/**
 * Format online status text for accessibility labels
 * @param isOnline - Whether the user is currently online
 * @returns Descriptive status text
 */
export const getOnlineStatusLabel = (isOnline: boolean): string => {
    return isOnline ? "User is online" : "User is offline";
};

/**
 * Get the appropriate avatar image source
 * @param user - User object containing image URL
 * @param fallbackImage - Optional fallback image path
 * @returns Image source URL
 */
export const getAvatarImageSource = (
    user?: User | null,
    fallbackImage: string = '/images/placeholder.jpg'
): string => {
    return user?.image || fallbackImage;
};
