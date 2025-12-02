'use client';

import { useRouter } from "next/navigation";
import UserProfileImage from "@/app/components/UserProfileImage";
import { User } from "@prisma/client";

/**
 * ProfileNavigationButton Props Interface
 */
interface ProfileNavButtonProps {
    /** Current user data */
    currentUserData: User;
    /** Optional custom click handler */
    onProfileClick?: () => void;
}

/**
 * ProfileNavigationButton Component
 *
 * Displays the current user's profile image in the navigation.
 * Clicking navigates to the user's profile page.
 *
 * @example
 * ```tsx
 * <ProfileNavigationButton
 *   currentUserData={user}
 * />
 * ```
 */
const ProfileNavigationButton: React.FC<ProfileNavButtonProps> = ({
    currentUserData,
    onProfileClick
}) => {
    const router = useRouter();

    const navigateToProfile = () => {
        if (onProfileClick) {
            onProfileClick();
        } else {
            router.push(`/users/${currentUserData.id}`);
        }
    };

    return (
        <nav className="mt-4 flex flex-col justify-between items-center">
            <div
                onClick={navigateToProfile}
                className="cursor-pointer hover:opacity-75 transition duration-200"
                title="View your profile"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateToProfile();
                    }
                }}
            >
                <UserProfileImage userData={currentUserData} />
            </div>
        </nav>
    );
};

export default ProfileNavigationButton;
