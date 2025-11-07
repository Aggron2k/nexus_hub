"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";
import { HiXMark } from "react-icons/hi2";
import Image from "next/image";

interface Employee {
    userId: string;
    name: string;
    email: string;
    image: string;
    role: string;
    position: any;
    hours: number;
    hourlyRate: number;
    grossAmount: number;
}

interface WeekBreakdown {
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
    totalHours: number;
    totalGrossAmount: number;
}

interface EmployeeDetails {
    user: {
        id: string;
        name: string;
        email: string;
        image: string;
        role: string;
        position: any;
    };
    year: number;
    month: number;
    hourlyRate: number;
    totalHours: number;
    grossAmount: number;
    weeklyBreakdown: WeekBreakdown[];
}

interface PayrollDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
    year: number;
    month: number;
}

const PayrollDetailsModal: React.FC<PayrollDetailsModalProps> = ({
    isOpen,
    onClose,
    employee,
    year,
    month,
}) => {
    const { language } = useLanguage();
    const [details, setDetails] = useState<EmployeeDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [existingPDFCount, setExistingPDFCount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            fetchEmployeeDetails();
            checkExistingPDFs();
        }
    }, [isOpen, employee.userId, year, month]);

    const fetchEmployeeDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `/api/payroll/employee?userId=${employee.userId}&year=${year}&month=${month}`
            );
            setDetails(response.data);
        } catch (error) {
            console.error('Error fetching employee details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkExistingPDFs = async () => {
        try {
            const response = await axios.get(`/api/documents?userId=${employee.userId}`);
            const documents = response.data;

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const searchString = `Payslip - ${monthNames[month - 1]} ${year}`;

            const existingPayslips = documents.filter((doc: any) =>
                doc.name.startsWith(searchString)
            );

            setExistingPDFCount(existingPayslips.length);
        } catch (error) {
            console.error('Error checking existing PDFs:', error);
        }
    };

    const handleGeneratePDF = async () => {
        // Figyelmeztetés ha már van PDF
        if (existingPDFCount > 0) {
            const confirmMessage = language === 'hu'
                ? `Már van ${existingPDFCount} fizetési bizonylat ehhez a hónaphoz. Biztosan létrehozol egy újat?\n\nAz új PDF a jelenlegi adatok alapján készül (v${existingPDFCount + 1}).`
                : `There are already ${existingPDFCount} payslip(s) for this month. Are you sure you want to create a new one?\n\nThe new PDF will be generated with current data (v${existingPDFCount + 1}).`;

            if (!confirm(confirmMessage)) {
                return;
            }
        }

        setIsGeneratingPDF(true);
        try {
            const response = await axios.post('/api/payroll/generate-pdf', {
                userId: employee.userId,
                year,
                month,
            });

            // Sikeres PDF generálás
            const version = existingPDFCount + 1;
            const successMessage = language === 'hu'
                ? `Fizetési bizonylat sikeresen elkészítve és feltöltve a Documents-be!${version > 1 ? ` (v${version})` : ''}`
                : `Payslip successfully generated and uploaded to Documents!${version > 1 ? ` (v${version})` : ''}`;

            alert(successMessage);

            // Frissítjük az existing PDF count-ot
            setExistingPDFCount(version);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(language === 'hu'
                ? 'Hiba történt a PDF generálás során.'
                : 'Error generating PDF.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const translations = {
        en: {
            title: "Payroll Details",
            hourlyRate: "Hourly Rate",
            totalHours: "Total Hours",
            grossAmount: "Gross Amount",
            weeklyBreakdown: "Weekly Breakdown",
            week: "Week",
            generatePDF: "Generate PDF",
            close: "Close",
            loading: "Loading...",
            generating: "Generating PDF...",
        },
        hu: {
            title: "Bérezés Részletek",
            hourlyRate: "Órabér",
            totalHours: "Összes Óra",
            grossAmount: "Bruttó Összeg",
            weeklyBreakdown: "Heti Bontás",
            week: "Hét",
            generatePDF: "PDF Generálás",
            close: "Bezárás",
            loading: "Betöltés...",
            generating: "PDF készítése...",
        }
    };

    const t = translations[language];

    const monthNames = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        hu: ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December']
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${monthNames[language][date.getMonth()]} ${date.getDate()}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Image
                            src={employee.image || '/images/placeholder.jpg'}
                            alt={employee.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{employee.name}</h2>
                            <p className="text-sm text-gray-600">
                                {monthNames[language][month - 1]} {year}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <HiXMark className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">{t.loading}</p>
                        </div>
                    ) : details ? (
                        <>
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">{t.hourlyRate}</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(details.hourlyRate)} Ft/h
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">{t.totalHours}</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {details.totalHours}h
                                    </p>
                                </div>
                                <div className="p-4 bg-nexus-primary rounded-lg">
                                    <p className="text-xs text-white/80 mb-1">{t.grossAmount}</p>
                                    <p className="text-lg font-bold text-white">
                                        {formatCurrency(details.grossAmount)} Ft
                                    </p>
                                </div>
                            </div>

                            {/* Weekly Breakdown */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.weeklyBreakdown}</h3>
                                <div className="space-y-2">
                                    {details.weeklyBreakdown.map((week) => (
                                        <div
                                            key={week.weekNumber}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {t.week} {week.weekNumber}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {week.totalHours}h → {formatCurrency(week.totalGrossAmount)} Ft
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={isGeneratingPDF}
                                    className="flex-1 px-4 py-2 bg-nexus-tertiary text-white rounded-lg hover:bg-nexus-tertiary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingPDF ? t.generating : t.generatePDF}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    {t.close}
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default PayrollDetailsModal;
