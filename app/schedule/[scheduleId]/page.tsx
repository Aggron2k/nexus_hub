"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiCalendar, HiArrowLeft, HiPlus } from "react-icons/hi2";
import Link from "next/link";
import { DayPilot, DayPilotScheduler } from "@daypilot/daypilot-lite-react";
import AddShiftModal from "../components/AddShiftModal";

export default function ScheduleDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const scheduleId = params?.scheduleId as string;
  const dateParam = searchParams?.get('date');
  const { language } = useLanguage();
  const [schedule, setSchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);

  // Fordítások
  const translations = {
    en: {
      back: "Back to Schedules",
      week: "Week",
      loading: "Loading schedule...",
      notFound: "Schedule not found",
      draft: "Draft",
      published: "Published"
    },
    hu: {
      back: "Vissza a beosztásokhoz",
      week: "Hét",
      loading: "Beosztás betöltése...",
      notFound: "Beosztás nem található",
      draft: "Piszkozat",
      published: "Publikált"
    }
  };

  const t = translations[language];

  // DayPilot konfiguráció
  const [schedulerConfig, setSchedulerConfig] = useState({
    timeHeaders: [
      { groupBy: "Day", format: "dddd M/d" },
      { groupBy: "Hour" }
    ],
    scale: "Hour",
    days: dateParam ? 1 : 7, // Ha van date param, csak 1 nap
    startDate: dateParam ? new Date(dateParam) : new Date(),
    timeRangeSelectedHandling: "Enabled",
    onTimeRangeSelected: async (args: any) => {
      const dp = args.control;
      const modal = await DayPilot.Modal.prompt("Create a new shift:", "Shift");
      dp.clearSelection();
      if (!modal.result) { return; }

      dp.events.add({
        start: args.start,
        end: args.end,
        id: DayPilot.guid(),
        resource: args.resource,
        text: modal.result
      });
    },
    eventDeleteHandling: "Update",
    onEventClick: async (args: any) => {
      const dp = args.control;
      const modal = await DayPilot.Modal.prompt("Update shift:", args.e.text());
      if (!modal.result) { return; }
      const e = args.e;
      e.data.text = modal.result;
      dp.events.update(e);
    },
    resources: [
      { name: "Resource 1", id: "R1" },
      { name: "Resource 2", id: "R2" },
      { name: "Resource 3", id: "R3" }
    ],
    events: []
  });

  // Beosztás és műszakok lekérése
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Schedule lekérése
        const scheduleResponse = await fetch(`/api/schedule/${scheduleId}`);
        if (!scheduleResponse.ok) {
          throw new Error('Failed to fetch schedule');
        }
        const scheduleData = await scheduleResponse.json();
        setSchedule(scheduleData);

        // Műszakok lekérése
        const shiftsResponse = await fetch(`/api/shifts?scheduleId=${scheduleId}`);
        if (shiftsResponse.ok) {
          const shiftsData = await shiftsResponse.json();
          setShifts(shiftsData);

          // Resources (felhasználók) és Events (műszakok) létrehozása
          const uniqueUsers = new Map();
          const events: any[] = [];

          shiftsData.forEach((shift: any) => {
            // Ha van date param, csak az adott napi műszakokat mutatjuk
            if (dateParam) {
              const shiftDate = new Date(shift.date).toISOString().split('T')[0];
              if (shiftDate !== dateParam) {
                return;
              }
            }

            // User hozzáadása a resources-hoz
            if (!uniqueUsers.has(shift.userId)) {
              uniqueUsers.set(shift.userId, {
                name: shift.user.name,
                id: shift.userId
              });
            }

            // Event létrehozása
            const positionName = (shift.position.displayNames as any)?.[language] || shift.position.name;
            const startTime = new Date(shift.startTime);
            const endTime = new Date(shift.endTime);
            const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            events.push({
              id: shift.id,
              start: shift.startTime,
              end: shift.endTime,
              resource: shift.userId,
              text: `${positionName}: ${startTimeStr} - ${endTimeStr}`,
              backColor: shift.position.color || '#3B82F6',
              borderColor: 'darker'
            });
          });

          // Resources és Events frissítése
          const resources = Array.from(uniqueUsers.values());

          setSchedulerConfig(prev => ({
            ...prev,
            startDate: dateParam ? new Date(dateParam) : new Date(scheduleData.weekStart),
            days: dateParam ? 1 : 7,
            resources: resources.length > 0 ? resources : [{ name: "No shifts yet", id: "empty" }],
            events: events
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (scheduleId) {
      fetchData();
    }
  }, [scheduleId, dateParam, language]);

  if (isLoading) {
    return (
      <div className="lg:pl-80 h-full flex items-center justify-center">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="lg:pl-80 h-full flex items-center justify-center">
        <p className="text-gray-500">{t.notFound}</p>
      </div>
    );
  }

  // Aktuális nap formázása
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatWeek = (weekStart: Date, weekEnd: Date) => {
    const start = new Date(weekStart).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const end = new Date(weekEnd).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    return `${start} - ${end}`;
  };

  return (
    <>
      {/* Add Shift Modal */}
      <AddShiftModal
        isOpen={isAddShiftModalOpen}
        onClose={() => setIsAddShiftModalOpen(false)}
        scheduleId={scheduleId}
        selectedDate={dateParam || new Date(schedule?.weekStart || new Date()).toISOString().split('T')[0]}
      />

      <div className="lg:pl-80 h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
          >
            <HiArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-nexus-primary rounded-lg">
                <HiCalendar className="h-6 w-6 text-nexus-tertiary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {dateParam ? formatDate(new Date(dateParam)) : t.week}
                </h1>
                {!dateParam && (
                  <p className="text-sm text-gray-600">
                    {formatWeek(schedule.weekStart, schedule.weekEnd)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Shift Button */}
              <button
                onClick={() => setIsAddShiftModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-nexus-tertiary text-white rounded-md hover:bg-nexus-primary transition"
              >
                <HiPlus className="h-5 w-5" />
                {language === 'hu' ? 'Műszak hozzáadása' : 'Add Shift'}
              </button>

              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  schedule.isPublished
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {schedule.isPublished ? t.published : t.draft}
              </span>
            </div>
          </div>
        </div>

        {/* DayPilot Scheduler */}
        <div className="flex-1 p-6 bg-nexus-bg overflow-auto">
          <div className="bg-white rounded-lg shadow">
            <DayPilotScheduler
              {...schedulerConfig}
            />
          </div>
        </div>
      </div>
    </>
  );
}
