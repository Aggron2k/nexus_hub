"use client";

import { HiChevronLeft, HiPlus, HiCheckCircle, HiXCircle } from "react-icons/hi2";

interface ScheduleMobileHeaderProps {
    onBack: () => void;
    title: string;
    showAddButton?: boolean;
    showPublishButton?: boolean;
    onAdd?: () => void;
    onPublish?: () => void;
    isPublished?: boolean;
    canManage?: boolean;
}

const ScheduleMobileHeader: React.FC<ScheduleMobileHeaderProps> = ({
    onBack,
    title,
    showAddButton = false,
    showPublishButton = false,
    onAdd,
    onPublish,
    isPublished = false,
    canManage = false
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

            {/* Action Buttons - Conditional (Manager+ only) */}
            {canManage && (
                <div className="flex items-center gap-2">
                    {/* Add Shift Button */}
                    {showAddButton && (
                        <button
                            className="text-nexus-tertiary hover:text-nexus-secondary transition cursor-pointer"
                            onClick={onAdd}
                            title="Add Shift"
                        >
                            <HiPlus size={32} />
                        </button>
                    )}

                    {/* Publish/Unpublish Button */}
                    {showPublishButton && (
                        <button
                            className={`transition cursor-pointer ${
                                isPublished
                                    ? "text-red-600 hover:text-red-700"
                                    : "text-green-600 hover:text-green-700"
                            }`}
                            onClick={onPublish}
                            title={isPublished ? "Unpublish" : "Publish"}
                        >
                            {isPublished ? (
                                <HiXCircle size={32} />
                            ) : (
                                <HiCheckCircle size={32} />
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScheduleMobileHeader;
