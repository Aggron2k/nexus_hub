"use client";

import { HiChevronLeft, HiPlus } from "react-icons/hi2";

interface MyRequestsMobileHeaderProps {
    onBack: () => void;
    title: string;
    showNewRequestButton?: boolean;
    onNewRequest?: () => void;
    isDeadlinePassed?: boolean;
}

const MyRequestsMobileHeader: React.FC<MyRequestsMobileHeaderProps> = ({
    onBack,
    title,
    showNewRequestButton = false,
    onNewRequest,
    isDeadlinePassed = false
}) => {
    return (
        <div className="bg-white w-full flex border-b-[1px] sm:px-4 py-3 px-4 lg:px-6 items-center justify-between shadow-sm sticky top-0 z-10 lg:hidden">
            <div className="flex gap-3 items-center">
                {/* Back Button - Icon only */}
                <button
                    className="text-nexus-tertiary hover:text-nexus-secondary transition cursor-pointer"
                    onClick={onBack}
                >
                    <HiChevronLeft size={32} />
                </button>

                {/* Title */}
                <div className="text-lg font-bold text-neutral-800">
                    {title}
                </div>
            </div>

            {/* New Request Button - Conditional */}
            {showNewRequestButton && (
                <button
                    className={`transition cursor-pointer ${
                        isDeadlinePassed
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-nexus-tertiary hover:text-nexus-secondary"
                    }`}
                    onClick={isDeadlinePassed ? undefined : onNewRequest}
                    disabled={isDeadlinePassed}
                >
                    <HiPlus size={32} />
                </button>
            )}
        </div>
    );
};

export default MyRequestsMobileHeader;
