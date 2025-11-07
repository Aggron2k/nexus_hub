"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { User } from "@prisma/client";
import { HiBuildingLibrary, HiExclamationTriangle } from "react-icons/hi2";

interface PaymentInfoProps {
    currentUser: User | null;
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({ currentUser }) => {
    const { language } = useLanguage();

    const translations = {
        en: {
            title: "Payment Information",
            hourlyRate: "Hourly Rate",
            currency: "Currency",
            bankName: "Bank Name",
            accountNumber: "Account Number",
            taxNumber: "Tax Number",
            socialSecurity: "Social Security Number",
            notProvided: "Not provided",
            warningTitle: "To modify your payment information",
            warningMessage: "Please contact HR or your manager.",
        },
        hu: {
            title: "Fizetési Információk",
            hourlyRate: "Órabér",
            currency: "Pénznem",
            bankName: "Bank Neve",
            accountNumber: "Számlaszám",
            taxNumber: "Adószám",
            socialSecurity: "TAJ Szám",
            notProvided: "Nincs megadva",
            warningTitle: "Módosításhoz",
            warningMessage: "Vedd fel a kapcsolatot a HR-rel vagy a menedzserrel.",
        }
    };

    const t = translations[language];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-nexus-primary rounded-lg">
                    <HiBuildingLibrary className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
                {/* Hourly Rate */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">{t.hourlyRate}</span>
                    <span className="text-lg font-bold text-gray-900">
                        {currentUser?.hourlyRate ? `${formatCurrency(currentUser.hourlyRate)} Ft/h` : t.notProvided}
                    </span>
                </div>

                {/* Currency */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">{t.currency}</span>
                    <span className="text-md font-semibold text-gray-900">
                        {currentUser?.currency || 'HUF'}
                    </span>
                </div>

                {/* Bank Name */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">{t.bankName}</span>
                    <span className="text-md text-gray-900">
                        {currentUser?.bankName || t.notProvided}
                    </span>
                </div>

                {/* Account Number */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">{t.accountNumber}</span>
                    <span className="text-md text-gray-900 font-mono">
                        {currentUser?.accountNumber || t.notProvided}
                    </span>
                </div>

                {/* Tax Number */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">{t.taxNumber}</span>
                    <span className="text-md text-gray-900 font-mono">
                        {currentUser?.taxNumber || t.notProvided}
                    </span>
                </div>

                {/* Social Security Number */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">{t.socialSecurity}</span>
                    <span className="text-md text-gray-900 font-mono">
                        {currentUser?.socialSecurityNumber || t.notProvided}
                    </span>
                </div>
            </div>

            {/* Warning Message */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <HiExclamationTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900">{t.warningTitle}</p>
                        <p className="text-sm text-amber-800 mt-1">{t.warningMessage}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentInfo;
