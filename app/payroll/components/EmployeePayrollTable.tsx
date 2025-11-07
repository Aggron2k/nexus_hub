"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import axios from "axios";
import { HiChevronLeft, HiChevronRight, HiDocumentText, HiMagnifyingGlass } from "react-icons/hi2";
import Image from "next/image";
import PayrollDetailsModal from "./PayrollDetailsModal";
import { useRouter } from "next/navigation";

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

interface TeamSummary {
    totalHours: number;
    totalGrossAmount: number;
    employeeCount: number;
    averageHours: number;
    averageGrossAmount: number;
}

interface TeamPayrollData {
    year: number;
    month: number;
    teamSummary: TeamSummary;
    employees: Employee[];
}

const EmployeePayrollTable: React.FC = () => {
    const { language } = useLanguage();
    const router = useRouter();
    const [data, setData] = useState<TeamPayrollData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTeamData = async (year: number, month: number) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/payroll/team?year=${year}&month=${month}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching team payroll:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamData(currentDate.getFullYear(), currentDate.getMonth() + 1);
    }, [currentDate]);

    const translations = {
        en: {
            title: "Team Payroll",
            teamSummary: "Team Summary",
            totalHours: "Total Hours",
            totalPay: "Total Pay",
            employeeCount: "Employees",
            avgHours: "Avg Hours/Employee",
            avgPay: "Avg Pay/Employee",
            name: "Name",
            position: "Position",
            hours: "Hours",
            hourlyRate: "Hourly Rate",
            grossAmount: "Gross Amount",
            actions: "Actions",
            viewDetails: "View Details",
            documents: "Documents",
            search: "Search by name or email...",
            loading: "Loading...",
            noData: "No data available.",
        },
        hu: {
            title: "Csapat Bérezés",
            teamSummary: "Csapat Összesítő",
            totalHours: "Összes Óra",
            totalPay: "Összes Fizetés",
            employeeCount: "Dolgozók",
            avgHours: "Átlag Óra/Fő",
            avgPay: "Átlag Fizetés/Fő",
            name: "Név",
            position: "Pozíció",
            hours: "Órák",
            hourlyRate: "Órabér",
            grossAmount: "Bruttó Összeg",
            actions: "Műveletek",
            viewDetails: "Részletek",
            documents: "Dokumentumok",
            search: "Keresés név vagy email alapján...",
            loading: "Betöltés...",
            noData: "Nincs elérhető adat.",
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

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleViewDetails = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleViewDocuments = (userId: string) => {
        router.push(`/documents/${userId}`);
    };

    const filteredEmployees = data?.employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header with Month Navigation */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <HiChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="text-lg font-semibold text-gray-700 min-w-[200px] text-center">
                        {monthNames[language][currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <HiChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">{t.loading}</p>
                </div>
            ) : data ? (
                <>
                    {/* Team Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gradient-to-r from-nexus-primary to-nexus-secondary rounded-lg">
                        <div className="text-center">
                            <p className="text-xs text-white/80">{t.totalHours}</p>
                            <p className="text-lg font-bold text-white">{data.teamSummary.totalHours}h</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-white/80">{t.totalPay}</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(data.teamSummary.totalGrossAmount)} Ft</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-white/80">{t.employeeCount}</p>
                            <p className="text-lg font-bold text-white">{data.teamSummary.employeeCount}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-white/80">{t.avgHours}</p>
                            <p className="text-lg font-bold text-white">{data.teamSummary.averageHours}h</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-white/80">{t.avgPay}</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(data.teamSummary.averageGrossAmount)} Ft</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t.search}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
                            />
                        </div>
                    </div>

                    {/* Employee Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t.name}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t.position}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t.hours}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t.hourlyRate}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t.grossAmount}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t.actions}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredEmployees.map((employee) => (
                                    <tr key={employee.userId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={employee.image || '/images/placeholder.jpg'}
                                                    alt={employee.name}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                                                    <p className="text-xs text-gray-500">{employee.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {employee.position ? employee.position[language] || employee.position['en'] : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                            {employee.hours}h
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                            {formatCurrency(employee.hourlyRate)} Ft/h
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-bold">
                                            {formatCurrency(employee.grossAmount)} Ft
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(employee)}
                                                    className="px-3 py-1 text-xs font-medium text-nexus-tertiary hover:text-nexus-tertiary/80 transition-colors"
                                                >
                                                    {t.viewDetails}
                                                </button>
                                                <button
                                                    onClick={() => handleViewDocuments(employee.userId)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title={t.documents}
                                                >
                                                    <HiDocumentText className="h-5 w-5 text-gray-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">{t.noData}</p>
                            </div>
                        )}
                    </div>
                </>
            ) : null}

            {/* Details Modal */}
            {selectedEmployee && (
                <PayrollDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    employee={selectedEmployee}
                    year={currentDate.getFullYear()}
                    month={currentDate.getMonth() + 1}
                />
            )}
        </div>
    );
};

export default EmployeePayrollTable;
