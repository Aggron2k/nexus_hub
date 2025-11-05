"use client";

import { User } from "@prisma/client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiClock, HiPlus } from "react-icons/hi2";
import clsx from "clsx";
import ShiftRequestModal from "./ShiftRequestModal";

interface WeekListProps {
  weekSchedules: any[];
  currentUser: User;
}

const WeekList: React.FC<WeekListProps> = ({ weekSchedules, currentUser }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // Fordítások
  const translations = {
    en: {
      title: "My Requests",
      week: "Week",
      deadline: "Deadline",
      noDeadline: "No deadline set",
      requests: "requests",
      request: "request",
      expired: "Expired",
      newRequest: "New Request",
      noSchedules: "No schedules available"
    },
    hu: {
      title: "Kéréseim",
      week: "Hét",
      deadline: "Határidő",
      noDeadline: "Nincs határidő",
      requests: "kérés",
      request: "kérés",
      expired: "Lejárt",
      newRequest: "Új kérés",
      noSchedules: "Nincs elérhető beosztás"
    },
  };

  const t = translations[language];

  // Hét formázása
  const formatWeek = (weekStart: Date, weekEnd: Date) => {
    const start = new Date(weekStart).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
    const end = new Date(weekEnd).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
    return `${start} - ${end}`;
  };

  // Deadline formázása
  const formatDeadline = (deadline: Date | null) => {
    if (!deadline) return t.noDeadline;
    return new Date(deadline).toLocaleString(language === 'hu' ? 'hu-HU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Határidő lejárt-e
  const isDeadlinePassed = (deadline: Date | null) => {
    if (!deadline) return false;
    return new Date() > new Date(deadline);
  };

  // Új kérés gomb click
  const handleNewRequest = (schedule: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  // Hét kiválasztása
  const handleWeekClick = (scheduleId: string) => {
    router.push(`/my-requests/${scheduleId}`);
  };

  // Szűrés: csak jövőbeli hetek vagy ahol már van kérés
  const now = new Date();
  const relevantSchedules = weekSchedules.filter(schedule => {
    const weekEnd = new Date(schedule.weekEnd);
    const hasRequests = schedule.shiftRequests && schedule.shiftRequests.length > 0;
    return weekEnd >= now || hasRequests;
  });

  return (
    <>
      {/* Shift Request Modal */}
      {selectedSchedule && (
        <ShiftRequestModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSchedule(null);
          }}
          weekScheduleId={selectedSchedule.id}
          weekStart={new Date(selectedSchedule.weekStart)}
          weekEnd={new Date(selectedSchedule.weekEnd)}
          requestDeadline={selectedSchedule.requestDeadline ? new Date(selectedSchedule.requestDeadline) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      <aside
        className={clsx(
          `fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200 bg-white`,
          "block w-full left-0"
        )}
      >
        <div className="px-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pt-4">
            <div className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
              {t.title}
            </div>
          </div>

          {/* Week List */}
          {relevantSchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noSchedules}
            </div>
          ) : (
            <div className="space-y-3">
              {relevantSchedules.map((schedule) => {
                const isActive = pathname === `/my-requests/${schedule.id}`;
                const requestCount = schedule.shiftRequests?.length || 0;
                const deadlinePassed = isDeadlinePassed(schedule.requestDeadline);
                const pendingCount = schedule.shiftRequests?.filter((r: any) => r.status === 'PENDING').length || 0;

                return (
                  <div
                    key={schedule.id}
                    onClick={() => handleWeekClick(schedule.id)}
                    className={clsx(
                      "rounded-lg p-4 cursor-pointer transition-all border",
                      isActive
                        ? "bg-nexus-primary border-nexus-tertiary shadow-md"
                        : "bg-white border-gray-200 hover:border-nexus-tertiary hover:shadow-sm"
                    )}
                  >
                    {/* Week címe */}
                    <div className={clsx(
                      "font-semibold mb-2",
                      isActive ? "text-gray-900" : "text-gray-800"
                    )}>
                      {t.week} {formatWeek(schedule.weekStart, schedule.weekEnd)}
                    </div>

                    {/* Deadline */}
                    <div className={clsx(
                      "text-sm mb-2",
                      deadlinePassed ? "text-red-600 font-medium" : "text-gray-600"
                    )}>
                      {t.deadline}: {formatDeadline(schedule.requestDeadline)}
                      {deadlinePassed && ` (${t.expired})`}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      {requestCount > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {requestCount} {requestCount === 1 ? t.request : t.requests}
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>

                    {/* Új kérés gomb */}
                    <button
                      onClick={(e) => handleNewRequest(schedule, e)}
                      disabled={deadlinePassed}
                      className={clsx(
                        "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        deadlinePassed
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : isActive
                          ? "bg-nexus-tertiary text-white hover:bg-opacity-90"
                          : "bg-nexus-tertiary text-white hover:bg-opacity-90"
                      )}
                    >
                      <HiPlus className="h-4 w-4" />
                      {t.newRequest}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default WeekList;
