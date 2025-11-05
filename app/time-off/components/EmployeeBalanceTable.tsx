"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  HiArrowUp,
  HiArrowDown,
  HiExclamationTriangle,
  HiCheckCircle,
} from "react-icons/hi2";

interface EmployeeBalance {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  annualVacationDays: number;
  usedVacationDays: number;
  pendingDays: number;
  remainingDays: number;
  availableDays: number;
  usagePercentage: number;
}

type SortField = "name" | "position" | "annualVacationDays" | "usedVacationDays" | "pendingDays" | "remainingDays" | "usagePercentage";
type SortDirection = "asc" | "desc";

const EmployeeBalanceTable: React.FC = () => {
  const { language } = useLanguage();
  const [employees, setEmployees] = useState<EmployeeBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchQuery, setSearchQuery] = useState("");

  const translations = {
    en: {
      title: "Team Vacation Balances",
      search: "Search by name or position...",
      name: "Name",
      position: "Position",
      annual: "Annual",
      used: "Used",
      pending: "Pending",
      remaining: "Remaining",
      available: "Available",
      usage: "Usage",
      days: "days",
      loading: "Loading...",
      noEmployees: "No employees found",
      lowBalance: "Low balance",
      goodBalance: "Good balance",
      employees: "employees",
    },
    hu: {
      title: "Csapat Szabadság Egyenlegek",
      search: "Keresés név vagy pozíció szerint...",
      name: "Név",
      position: "Pozíció",
      annual: "Éves",
      used: "Használt",
      pending: "Függőben",
      remaining: "Maradt",
      available: "Elérhető",
      usage: "Használat",
      days: "nap",
      loading: "Betöltés...",
      noEmployees: "Nincs alkalmazott",
      lowBalance: "Kevés szabadság",
      goodBalance: "Megfelelő szabadság",
      employees: "alkalmazott",
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/time-off/team");

        if (!response.ok) {
          throw new Error("Failed to fetch team balances");
        }

        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        console.error("Error fetching team balances:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const filteredEmployees = sortedEmployees.filter((employee) => {
    const query = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.position.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query)
    );
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <HiArrowUp className="h-4 w-4" />
    ) : (
      <HiArrowDown className="h-4 w-4" />
    );
  };

  const getBalanceWarning = (remaining: number, annual: number) => {
    const percentage = (remaining / annual) * 100;
    if (percentage < 20) {
      return (
        <HiExclamationTriangle
          className="h-5 w-5 text-red-600"
          title={t.lowBalance}
        />
      );
    }
    if (percentage > 80) {
      return (
        <HiCheckCircle
          className="h-5 w-5 text-green-600"
          title={t.goodBalance}
        />
      );
    }
    return null;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return "text-red-600 font-bold";
    if (percentage >= 50) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.title}</h2>
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
          <p className="text-sm text-gray-500">
            {filteredEmployees.length} {t.employees}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-secondary focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  {t.name}
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("position")}
              >
                <div className="flex items-center gap-2">
                  {t.position}
                  <SortIcon field="position" />
                </div>
              </th>
              <th
                className="text-center py-3 px-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("annualVacationDays")}
              >
                <div className="flex items-center justify-center gap-2">
                  {t.annual}
                  <SortIcon field="annualVacationDays" />
                </div>
              </th>
              <th
                className="text-center py-3 px-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("usedVacationDays")}
              >
                <div className="flex items-center justify-center gap-2">
                  {t.used}
                  <SortIcon field="usedVacationDays" />
                </div>
              </th>
              <th
                className="text-center py-3 px-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("pendingDays")}
              >
                <div className="flex items-center justify-center gap-2">
                  {t.pending}
                  <SortIcon field="pendingDays" />
                </div>
              </th>
              <th
                className="text-center py-3 px-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("remainingDays")}
              >
                <div className="flex items-center justify-center gap-2">
                  {t.remaining}
                  <SortIcon field="remainingDays" />
                </div>
              </th>
              <th
                className="text-center py-3 px-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("usagePercentage")}
              >
                <div className="flex items-center justify-center gap-2">
                  {t.usage}
                  <SortIcon field="usagePercentage" />
                </div>
              </th>
              <th className="text-center py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {t.noEmployees}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-xs text-gray-500">{employee.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-nexus-primary text-nexus-tertiary rounded text-xs font-medium">
                      {employee.position}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 font-medium">
                    {employee.annualVacationDays}
                  </td>
                  <td className="text-center py-3 px-4 font-medium">
                    {employee.usedVacationDays}
                  </td>
                  <td className="text-center py-3 px-4">
                    {employee.pendingDays > 0 ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        {employee.pendingDays}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-4 font-semibold">
                    {employee.remainingDays}
                  </td>
                  <td className={`text-center py-3 px-4 ${getUsageColor(employee.usagePercentage)}`}>
                    {employee.usagePercentage}%
                  </td>
                  <td className="text-center py-3 px-4">
                    {getBalanceWarning(employee.remainingDays, employee.annualVacationDays)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeBalanceTable;
