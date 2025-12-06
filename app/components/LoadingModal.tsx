"use client";

import React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { ClockLoader } from "react-spinners";

/**
 * LoadingModal Component
 *
 * Displays a centered loading spinner overlay.
 * Used by Next.js loading.tsx files during page transitions.
 *
 * @example
 * ```tsx
 * // In app/users/loading.tsx
 * import LoadingModal from "../components/LoadingModal";
 * export default function Loading() {
 *   return <LoadingModal />;
 * }
 * ```
 */
const LoadingModal = () => {
    return (
        <Dialog open onClose={() => {}} className="z-50 relative">
            {/* Backdrop overlay */}
            <div className="bg-gray-100 bg-opacity-50 fixed inset-0" />

            {/* Centered spinner container */}
            <div className="overflow-y-auto fixed inset-0 z-10">
                <div className="text-center flex min-h-full p-4 justify-center items-center">
                    <DialogPanel>
                        <ClockLoader color="#552E78" size={50} />
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default LoadingModal;
