"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

interface VacationRequest {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  notes?: string | null;
}

const VacationCalendar: React.FC = () => {
  const { language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const translations = {
    en: {
      title: "Vacation Calendar",
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      approved: "Approved",
      pending: "Pending",
      rejected: "Rejected",
      today: "Today",
    },
    hu: {
      title: "Szabadság Naptár",
      months: ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"],
      days: ["Hé", "Ke", "Sze", "Csü", "Pé", "Szo", "Va"],
      approved: "Jóváhagyott",
      pending: "Függőben",
      rejected: "Elutasítva",
      today: "Ma",
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/time-off/requests?year=${currentDate.getFullYear()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }

        const data = await response.json();
        setRequests(data);
      } catch (err) {
        console.error("Error fetching vacation requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Convert to Monday = 0

    return { daysInMonth, startingDayOfWeek };
  };

  const getRequestForDate = (date: Date) => {
    return requests.find((request) => {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      date.setHours(12, 0, 0, 0);
      return date >= startDate && date <= endDate;
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "";
    switch (status) {
      case "APPROVED":
        return "bg-green-500 text-white";
      case "PENDING":
        return "bg-yellow-500 text-white";
      case "REJECTED":
        return "bg-red-500 text-white";
      default:
        return "";
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  return (
    <div className="bg-white rounded-lg shadow p-5">
      {/* Header - Medium size */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">{t.title}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={previousMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-base font-semibold min-w-[160px] text-center">
            {t.months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend - Medium */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-green-500"></div>
          <span>{t.approved}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-yellow-500"></div>
          <span>{t.pending}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-red-500"></div>
          <span>{t.rejected}</span>
        </div>
      </div>

      {/* Calendar Grid - Medium cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Day Headers */}
        {t.days.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 text-sm py-1.5">
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="w-11 h-11"></div>
        ))}

        {/* Days - Medium cells (44px = 11*4) */}
        {days.map((day) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const request = getRequestForDate(date);
          const today = isToday(date);

          return (
            <div
              key={day}
              className={`
                w-11 h-11 flex items-center justify-center rounded-lg text-sm font-medium
                ${request ? getStatusColor(request.status) : "bg-gray-50 text-gray-700"}
                ${today && !request ? "ring-2 ring-nexus-secondary" : ""}
                ${today && request ? "ring-2 ring-white" : ""}
                transition-all cursor-default
              `}
              title={request ? `${request.notes || "Vacation"} (${request.status})` : ""}
            >
              {day}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center text-gray-500 text-sm mt-3">Loading...</div>
      )}
    </div>
  );
};

export default VacationCalendar;
