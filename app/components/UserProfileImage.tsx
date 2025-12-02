'use client';

import { User } from "@prisma/client";
import Image from "next/image";
import { useOnlineUsersList } from "../hooks/useOnlineUsersList";
import { checkUserOnlineStatus, getAvatarImageSource } from "../utils/presenceHelpers";

/**
 * UserProfileImage Props Interface
 */
interface ProfileImageProps {
    userData?: User | Partial<User>;
    showOnlineIndicator?: boolean;
}

/**
 * UserProfileImage Component
 *
 * Displays a user's profile image with an optional online status indicator.
 * The component shows a circular avatar with a green dot when the user is online.
 *
 * @param userData - User object containing profile information
 * @param showOnlineIndicator - Whether to display the online status indicator (default: true)
 */
const UserProfileImage: React.FC<ProfileImageProps> = ({
    userData,
    showOnlineIndicator = true
}) => {
    const { onlineUserIds } = useOnlineUsersList();
    const userIsOnline = checkUserOnlineStatus(userData?.email, onlineUserIds);

    const imageSource = getAvatarImageSource(userData as User);
    const userName = userData?.name || 'User';

    return (
        <div className="relative">
            <div className="overflow-hidden rounded-full inline-block h-9 w-9 md:h-11 md:w-11 relative">
                <Image
                    alt={`Profile image of ${userName}`}
                    src={imageSource}
                    fill
                    sizes="(max-width: 768px) 36px, 44px"
                />
            </div>
            {showOnlineIndicator && userIsOnline && (
                <span
                    className="block rounded-full ring-white ring-2 bg-green-500 h-2 w-2 md:h-3 md:w-3 absolute top-0 right-0"
                    aria-label="User is online"
                />
            )}
        </div>
    );
}

export default UserProfileImage;
