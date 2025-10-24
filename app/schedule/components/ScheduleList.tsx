"use client";

import { User } from "@prisma/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiCalendar, HiPlus } from "react-icons/hi2";
import clsx from "clsx";
import NewScheduleModal from "./NewScheduleModal";

interface ScheduleListProps {
  currentUser: User;
  canManage: boolean;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ currentUser, canManage }) => {
  const router = useRouter();
  const { language } = useLanguage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Fordítások
  const translations = {
    en: {
      title: "Schedules",
      createSchedule: "Create Schedule",
      noSchedules: "No schedules found",
      week: "Week",
      published: "Published",
      draft: "Draft"
    },
    hu: {
      title: "Beosztások",
      createSchedule: "Beosztás létrehozása",
      noSchedules: "Nincs beosztás",
      week: "Hét",
      published: "Publikált",
      draft: "Piszkozat"
    },
  };

  const t = translations[language];

  // Lekérjük a beosztásokat az API-ból
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch('/api/schedule');
        if (!response.ok) {
          throw new Error('Failed to fetch schedules');
        }
        const data = await response.json();
        setSchedules(data);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Hét kinyitása/becsukása
  const toggleWeek = (scheduleId: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  // Napok generálása egy héthez
  const generateWeekDays = (weekStart: Date) => {
    const days = [];
    const start = new Date(weekStart);

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }

    return days;
  };

  // Nap formázása
  const formatDay = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

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

  return (
    <>
      {/* New Schedule Modal */}
      <NewScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
      />

      <aside
        className={clsx(
          `fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200 bg-white`,
          "block w-full left-0"
        )}
      >
        <div className="px-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-4">
          <div className="text-2xl font-bold text-neutral-800">
            {t.title}
          </div>

          {/* Create Button - Only for Manager+ */}
          {canManage && (
            <div
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-full p-2 bg-nexus-tertiary text-white hover:bg-nexus-primary focus-visible:bg-nexus-primary cursor-pointer transition hover:text-black"
              title={t.createSchedule}
            >
              <HiPlus size={20} />
            </div>
          )}
        </div>

        {/* Schedule List */}
        <div className="space-y-2">
          {schedules.length > 0 ? (
            schedules.map((schedule) => {
              const isExpanded = expandedWeeks.has(schedule.id);
              const weekDays = generateWeekDays(schedule.weekStart);

              return (
                <div
                  key={schedule.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Week Header - Clickable */}
                  <div
                    onClick={() => toggleWeek(schedule.id)}
                    className="p-4 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <HiCalendar className="h-5 w-5 text-nexus-tertiary" />
                        <span className="font-medium text-gray-900">
                          {t.week}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "text-xs px-2 py-1 rounded-full",
                            schedule.isPublished
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          )}
                        >
                          {schedule.isPublished ? t.published : t.draft}
                        </span>
                        <svg
                          className={clsx(
                            "h-4 w-4 text-gray-500 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatWeek(schedule.weekStart, schedule.weekEnd)}
                    </p>
                  </div>

                  {/* Days List - Expandable */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {weekDays.map((day, index) => (
                        <div
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/schedule/${schedule.id}?date=${day.toISOString().split('T')[0]}`);
                          }}
                          className="px-4 py-3 hover:bg-nexus-primary hover:text-black transition cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {formatDay(day)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <HiCalendar className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {t.noSchedules}
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        {canManage && (
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              {language === 'hu'
                ? 'Kattints a + gombra új heti beosztás létrehozásához.'
                : 'Click the + button to create a new weekly schedule.'}
            </p>
          </div>
        )}
        </div>
      </aside>
    </>
  );
};

export default ScheduleList;
