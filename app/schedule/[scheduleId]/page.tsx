"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  const [editingShift, setEditingShift] = useState<any>(null);
  const shiftsRef = useRef<any[]>([]);

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
    timeRangeSelectedHandling: "Disabled", // Letiltjuk az üres területre kattintást
    eventDeleteHandling: "Disabled",
    eventResizeHandling: "Update", // Engedélyezzük az események átméretezését
    onEventResized: async (args: any) => {
      console.log("Event resized!", args.e.id());
      console.log("New start:", args.newStart.toString());
      console.log("New end:", args.newEnd.toString());

      // Megkeressük a shift-et
      const shiftToUpdate = shiftsRef.current.find(shift => shift.id === args.e.id());

      if (shiftToUpdate) {
        console.log("Updating shift in database...");

        try {
          // Órák kiszámítása
          const startTime = new Date(args.newStart.toString());
          const endTime = new Date(args.newEnd.toString());
          const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

          const response = await fetch(`/api/shifts/${args.e.id()}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              weekScheduleId: shiftToUpdate.weekScheduleId,
              userId: shiftToUpdate.userId,
              positionId: shiftToUpdate.positionId,
              date: shiftToUpdate.date,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              hoursWorked,
              notes: shiftToUpdate.notes || undefined,
            }),
          });

          if (response.ok) {
            console.log("Shift updated successfully!");

            // Frissítjük a shiftsRef-et
            const updatedShift = await response.json();
            const index = shiftsRef.current.findIndex(s => s.id === args.e.id());
            if (index !== -1) {
              shiftsRef.current[index] = updatedShift;
              setShifts([...shiftsRef.current]);
            }

            // Frissítjük az event text-et az új időpontokkal
            const positionName = (shiftToUpdate.position.displayNames as any)?.[language] || shiftToUpdate.position.name;
            const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            args.e.data.text = `${positionName}: ${startTimeStr} - ${endTimeStr}`;
            args.control.events.update(args.e);
          } else if (response.status === 409) {
            // Overlap conflict
            const errorMessage = await response.text();
            console.error("Shift overlap detected:", errorMessage);
            alert(errorMessage);
            // Visszaállítjuk az eredeti állapotot - refresh az oldalt
            window.location.reload();
          } else {
            console.error("Failed to update shift");
            alert(language === 'hu' ? 'Nem sikerült frissíteni a műszakot' : 'Failed to update shift');
            // Visszaállítjuk az eredeti állapotot
            args.control.message(language === 'hu' ? 'A frissítés sikertelen volt' : 'Update failed');
          }
        } catch (error) {
          console.error('Error updating shift:', error);
          alert(language === 'hu' ? 'Hiba történt a műszak frissítése közben' : 'Error updating shift');
        }
      }
    },
    onEventClick: (args: any) => {
      console.log("Event clicked!", args.e.id());
      console.log("Available shifts in ref:", shiftsRef.current);

      // Megkeressük a shift-et a shiftsRef-ben az event ID alapján
      const clickedShift = shiftsRef.current.find(shift => shift.id === args.e.id());

      console.log("Found shift:", clickedShift);

      if (clickedShift) {
        // Beállítjuk a szerkesztendő shift-et
        const editData = {
          id: clickedShift.id,
          userId: clickedShift.userId,
          positionId: clickedShift.positionId,
          startTime: clickedShift.startTime,
          endTime: clickedShift.endTime,
          notes: clickedShift.notes || "",
        };

        console.log("Setting edit data:", editData);
        setEditingShift(editData);

        // Megnyitjuk a modalt
        console.log("Opening modal...");
        setIsAddShiftModalOpen(true);
      } else {
        console.log("Shift not found in shifts array!");
      }
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
          shiftsRef.current = shiftsData; // Frissítjük a ref-et is

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

            // DayPilot helyi időben várja az időpontokat (nem UTC)
            // Konvertáljuk a helyi időzónába
            const localStart = new Date(startTime.getTime() - (startTime.getTimezoneOffset() * 60000));
            const localEnd = new Date(endTime.getTime() - (endTime.getTimezoneOffset() * 60000));

            events.push({
              id: shift.id,
              start: localStart.toISOString(),
              end: localEnd.toISOString(),
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
      {/* Add/Edit Shift Modal */}
      <AddShiftModal
        isOpen={isAddShiftModalOpen}
        onClose={() => {
          setIsAddShiftModalOpen(false);
          setEditingShift(null);
        }}
        scheduleId={scheduleId}
        selectedDate={editingShift ? new Date(editingShift.startTime).toISOString().split('T')[0] : (dateParam || new Date(schedule?.weekStart || new Date()).toISOString().split('T')[0])}
        editShift={editingShift}
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
                onClick={() => {
                  setEditingShift(null);
                  setIsAddShiftModalOpen(true);
                }}
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
