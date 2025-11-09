"use client";

import { HiChevronLeft } from "react-icons/hi2";

interface PayrollMobileHeaderProps {
    onBack: () => void;
    title: string;
}

const PayrollMobileHeader: React.FC<PayrollMobileHeaderProps> = ({ onBack, title }) => {
    return (
        <div className="bg-white w-full flex border-b-[1px] sm:px-4 py-3 px-4 lg:px-6 items-center shadow-sm sticky top-0 z-10 lg:hidden">
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
        </div>
    );
};

export default PayrollMobileHeader;
