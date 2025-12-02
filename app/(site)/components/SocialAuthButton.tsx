'use client';

import { IconType } from 'react-icons';
import clsx from 'clsx';

/**
 * SocialAuthButton Props Interface
 */
interface SocialAuthProps {
    /** React Icon component to display */
    icon: IconType;
    /** Click handler function */
    onClick: () => void;
    /** Whether the button is disabled */
    isDisabled?: boolean;
    /** Accessible label for screen readers */
    ariaLabel?: string;
}

/**
 * SocialAuthButton Component
 *
 * A button component for social authentication providers (GitHub, Google, etc.).
 * Provides consistent styling and behavior for OAuth login flows.
 *
 * @example
 * ```tsx
 * <SocialAuthButton
 *   icon={BsGithub}
 *   onClick={handleGitHubLogin}
 *   ariaLabel="Sign in with GitHub"
 * />
 * ```
 */
const SocialAuthButton: React.FC<SocialAuthProps> = ({
    icon: Icon,
    onClick,
    isDisabled = false,
    ariaLabel
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            aria-label={ariaLabel}
            className={clsx(
                'w-full px-4 py-2 rounded-md shadow-sm',
                'flex items-center justify-center',
                'ring-1 ring-inset ring-gray-300',
                'bg-nexus-tertiary hover:bg-nexus-secondary text-white',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'transition-all duration-200',
                isDisabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <Icon className="h-5 w-5" />
        </button>
    );
};

export default SocialAuthButton;
