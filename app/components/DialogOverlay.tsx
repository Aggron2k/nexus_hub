"use client";

import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { IoClose } from "react-icons/io5";

/**
 * Dialog size variants for different use cases
 */
type DialogSize = 'small' | 'medium' | 'large' | 'full';

/**
 * Props interface for DialogOverlay component
 */
interface DialogOverlayProps {
    /** Controls the visibility state of the dialog */
    visible?: boolean;

    /** Callback function triggered when dialog should close */
    onDismiss: () => void;

    /** Content to be rendered inside the dialog */
    content: React.ReactNode;

    /** Optional title displayed at the top of the dialog */
    title?: string;

    /** Size variant for the dialog panel (default: 'medium') */
    size?: DialogSize;

    /** Whether to show the close button in top-right corner (default: true) */
    showCloseButton?: boolean;
}

/**
 * DialogOverlay Component
 *
 * A customizable modal dialog overlay component built with Headless UI.
 * Provides a backdrop with smooth transitions and a centered content panel.
 *
 * Features:
 * - Multiple size variants (small, medium, large, full)
 * - Optional title header
 * - Configurable close button
 * - Smooth fade and scale animations
 * - Scroll support for overflow content
 * - Keyboard (ESC) and click-outside dismiss
 *
 * @example
 * ```tsx
 * <DialogOverlay
 *   visible={isOpen}
 *   onDismiss={() => setIsOpen(false)}
 *   title="User Settings"
 *   size="large"
 *   content={<YourFormContent />}
 * />
 * ```
 */
const DialogOverlay: React.FC<DialogOverlayProps> = ({
    visible,
    onDismiss,
    content,
    title,
    size = 'medium',
    showCloseButton = true
}) => {
    // Map size variants to Tailwind max-width classes
    const sizeClasses: Record<DialogSize, string> = {
        small: 'sm:max-w-md',
        medium: 'sm:max-w-xl',
        large: 'sm:max-w-3xl',
        full: 'sm:max-w-5xl'
    };

    return (
        <Transition show={visible} as={Fragment}>
            <Dialog as="div" className="z-50 relative" onClose={onDismiss}>
                {/* Backdrop overlay with fade transition */}
                <TransitionChild
                    as={Fragment}
                    enter="duration-250 ease-out"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="duration-150 ease-in"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="bg-slate-600 bg-opacity-80 fixed inset-0 transition-opacity" />
                </TransitionChild>

                {/* Dialog container */}
                <div className="overflow-y-auto fixed inset-0 z-10">
                    <div className="sm:p-0 flex min-h-full p-4 justify-center items-center text-center">
                        {/* Dialog panel with scale transition */}
                        <TransitionChild
                            as={Fragment}
                            enter="duration-250 ease-out"
                            enterFrom="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-90"
                            enterTo="translate-y-0 opacity-100 sm:scale-100"
                            leave="duration-150 ease-in"
                            leaveFrom="translate-y-0 opacity-100 sm:scale-100"
                            leaveTo="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-90"
                        >
                            <DialogPanel className={`
                                transform relative overflow-y-auto max-h-[90vh]
                                bg-white rounded-lg shadow-xl
                                pb-4 px-4 text-left transition-all w-full
                                sm:my-8 sm:w-full sm:p-6
                                ${sizeClasses[size]}
                            `}>
                                {/* Optional close button */}
                                {showCloseButton && (
                                    <div className="sm:block z-10 hidden pt-4 pr-4 top-0 right-0 absolute">
                                        <button
                                            type="button"
                                            className="backdrop-blur-sm bg-white/90 rounded-md text-gray-400 hover:text-gray-600
                                                focus:outline-none focus:ring-2 focus:ring-nexus-primary focus:ring-offset-2"
                                            onClick={onDismiss}
                                            aria-label="Close dialog"
                                        >
                                            <span className="sr-only">Bezár</span>
                                            <IoClose className="w-6 h-6" />
                                        </button>
                                    </div>
                                )}

                                {/* Optional title header */}
                                {title && (
                                    <div className="border-b border-gray-200 pb-4 mb-4">
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {title}
                                        </h3>
                                    </div>
                                )}

                                {/* Dialog content */}
                                {content}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default DialogOverlay;
