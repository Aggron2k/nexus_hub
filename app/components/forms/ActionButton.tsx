'use client';

import clsx from 'clsx';
import { ReactNode } from 'react';

/**
 * Button Variant Types
 */
type ButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * ActionButton Props Interface
 */
interface ActionButtonProps {
    /** Button type attribute */
    type?: 'submit' | 'button' | 'reset';
    /** Whether button should take full width */
    fullWidth?: boolean;
    /** Button content */
    children?: ReactNode;
    /** Click handler function */
    onClick?: () => void;
    /** Visual variant of the button */
    variant?: ButtonVariant;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Whether to show loading state */
    isLoading?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * ActionButton Component
 *
 * A versatile button component with multiple variants and states.
 * Supports primary, secondary, and danger styles with loading states.
 *
 * @example
 * ```tsx
 * <ActionButton
 *   type="submit"
 *   variant="primary"
 *   fullWidth
 *   isLoading={isSubmitting}
 * >
 *   Submit Form
 * </ActionButton>
 * ```
 */
const ActionButton: React.FC<ActionButtonProps> = ({
    type = 'button',
    fullWidth = false,
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    isLoading = false,
    className
}) => {
    const isDisabled = disabled || isLoading;

    const getVariantClasses = () => {
        switch (variant) {
            case 'danger':
                return 'bg-rose-500 hover:bg-rose-600 focus-visible:outline-rose-600 text-white';
            case 'secondary':
                return 'bg-gray-200 hover:bg-gray-300 focus-visible:outline-gray-400 text-gray-900';
            case 'primary':
            default:
                return 'bg-nexus-tertiary hover:bg-nexus-secondary focus-visible:outline-nexus-primary text-white';
        }
    };

    return (
        <button
            onClick={onClick}
            type={type}
            disabled={isDisabled}
            className={clsx(
                'rounded-md px-3 py-2 font-semibold text-sm flex justify-center items-center',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                'transition-colors duration-200',
                fullWidth && 'w-full',
                isDisabled && 'opacity-50 cursor-not-allowed',
                !isDisabled && getVariantClasses(),
                className
            )}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <span>Loading...</span>
                </div>
            ) : (
                children
            )}
        </button>
    );
}

export default ActionButton;
