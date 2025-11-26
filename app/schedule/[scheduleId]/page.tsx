"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { HiCalendar, HiArrowLeft, HiPlus } from "react-icons/hi2";
import Link from "next/link";
import { DayPilot, DayPilotScheduler } from "@daypilot/daypilot-lite-react";
import AddShiftModal from "../components/AddShiftModal";
import ConvertRequestModal from "../components/ConvertRequestModal";
import ReviewRequestModal from "../components/ReviewRequestModal";
import ActualHoursModal from "../components/ActualHoursModal";
import ScheduleMobileHeader from "../components/ScheduleMobileHeader";
import ScheduleMobileDayView from "../components/ScheduleMobileDayView";
import axios from "axios";
import toast from "react-hot-toast";

export default function ScheduleDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const scheduleId = params?.scheduleId as string;
  const dateParam = searchParams?.get('date');
  const { language } = useLanguage();
  const [schedule, setSchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [editingShift, setEditingShift] = useState<any>(null);
  const shiftsRef = useRef<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currentUserRef = useRef<any>(null); // useRef a callback-ekhez
  const [shiftRequests, setShiftRequests] = useState<any[]>([]);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isActualHoursModalOpen, setIsActualHoursModalOpen] = useState(false);
  const [selectedShiftForActualHours, setSelectedShiftForActualHours] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fordítások
  const translations = {
    en: {
      back: "Back to Schedules",
      week: "Week",
      loading: "Loading schedule...",
      notFound: "Schedule not found",
      draft: "Draft",
      published: "Published",
      publish: "Publish",
      unpublish: "Unpublish",
      publishConfirm: "Are you sure you want to publish this schedule? All employees will be able to see it and ActualWorkHours entries will be created.",
      unpublishConfirm: "Are you sure you want to unpublish this schedule? Employees will no longer see it.",
      publishing: "Publishing...",
      unpublishing: "Unpublishing..."
    },
    hu: {
      back: "Vissza a beosztásokhoz",
      week: "Hét",
      loading: "Beosztás betöltése...",
      notFound: "Beosztás nem található",
      draft: "Piszkozat",
      published: "Publikált",
      publish: "Publikálás",
      unpublish: "Visszavonás",
      publishConfirm: "Biztosan publikálod ezt a beosztást? Minden dolgozó látni fogja, és ActualWorkHours bejegyzések készülnek.",
      unpublishConfirm: "Biztosan visszavonod a publikálást? A dolgozók nem fogják látni.",
      publishing: "Publikálás...",
      unpublishing: "Visszavonás..."
    }
  };

  const t = translations[language];

  // Felhasználó lekérése (KORÁBBAN kell betölteni!)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/users/me');
        setCurrentUser(response.data);
        currentUserRef.current = response.data; // Ref-be is mentjük
        console.log("👤 Current user loaded:", response.data.role);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Publish/Unpublish handler
  const handlePublish = async () => {
    if (!schedule) return;

    const confirmMessage = schedule.isPublished ? t.unpublishConfirm : t.publishConfirm;
    if (!confirm(confirmMessage)) return;

    setIsPublishing(true);

    try {
      const response = await fetch(`/api/schedule/${scheduleId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !schedule.isPublished
        }),
      });

      if (response.ok) {
        console.log(`✅ Schedule ${schedule.isPublished ? 'unpublished' : 'published'} successfully`);
        // Frissítjük az oldalt hogy látszódjon a változás
        window.location.reload();
      } else {
        const errorMessage = await response.text();
        console.error('Failed to publish/unpublish schedule:', errorMessage);
        toast.error(language === 'hu' ? 'Nem sikerült a művelet' : 'Failed to publish/unpublish');
      }
    } catch (error) {
      console.error('Error publishing/unpublishing schedule:', error);
      toast.error(language === 'hu' ? 'Hiba történt a művelet során' : 'Error occurred');
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete shift handler (for mobile)
  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm(language === 'hu' ? 'Biztosan törlöd ezt a műszakot?' : 'Are you sure you want to delete this shift?')) {
      return;
    }

    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('✅ Shift deleted successfully');
        window.location.reload();
      } else {
        const errorMessage = await response.text();
        console.error('Failed to delete shift:', errorMessage);
        toast.error(language === 'hu' ? 'Nem sikerült törölni a műszakot' : 'Failed to delete shift');
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error(language === 'hu' ? 'Hiba történt a törlés során' : 'Error occurred while deleting');
    }
  };

  // Approve request handler
  const approveRequest = async (requestId: string) => {
    try {
      await axios.patch(`/api/shift-requests/${requestId}/review`, {
        action: "approve",
      });
      toast.success("Kérés jóváhagyva");
      window.location.reload();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Hiba a jóváhagyás során");
    }
  };


  // Event click handler - KÜLÖN definiálva, hogy lássa a currentUser-t
  const handleEventClick = (args: any) => {
    const eventType = args.e.data.tags?.type;
    console.log("Event clicked!", args.e.id(), "Type:", eventType);

    if (eventType === 'request') {
      // ShiftRequest-re kattintottak → Review Modal (szabadság egyenleg megjelenítésével)
      const requestData = args.e.data.tags.data;
      console.log("Request clicked:", requestData);
      setSelectedRequest(requestData);
      setIsReviewModalOpen(true); // Review Modal először (szabadság egyenleggel)
    } else if (eventType === 'shift') {
      // Shift-re kattintottak
      const shiftData = args.e.data.tags.data;
      const isPlaceholder = args.e.data.tags.isPlaceholder; // Check if it's a placeholder shift

      // Megkeressük a shift-et a shiftsRef-ben az event ID alapján
      const clickedShift = shiftsRef.current.find(shift => shift.id === args.e.id());

      if (clickedShift) {
        console.log("🕐 Shift clicked!");
        console.log("  Is placeholder:", isPlaceholder);
        console.log("  Current user (from ref):", currentUserRef.current?.role);

        // Ha PLACEHOLDER shift -> csak GM/CEO töltheti ki
        if (isPlaceholder) {
          // Csak GeneralManager és CEO szerkeszthet shift-et
          if (!currentUserRef.current || !['GeneralManager', 'CEO'].includes(currentUserRef.current.role)) {
            console.log("  ❌ Placeholder shift click denied - not GM/CEO");
            return;
          }

          console.log("  ✅ Placeholder shift -> Opening Edit Modal to fill in details");
          const editData = {
            id: clickedShift.id,
            userId: clickedShift.userId,
            positionId: clickedShift.positionId, // null
            startTime: clickedShift.startTime, // null
            endTime: clickedShift.endTime, // null
            date: clickedShift.date, // FONTOS: A shift dátuma (melyik napra szól)
            notes: clickedShift.notes || "",
          };

          setEditingShift(editData);
          setIsAddShiftModalOpen(true);
        } else {
          // Normál shift - ellenőrizzük hogy véget ért-e a műszak
          const now = new Date();
          const shiftEnd = new Date(clickedShift.endTime);
          const hasEnded = now > shiftEnd;

          console.log("  Current time:", now.toISOString());
          console.log("  Shift end time:", shiftEnd.toISOString());
          console.log("  Has ended:", hasEnded);
          console.log("  Shift already has actualWorkHours:", clickedShift.actualWorkHours?.status);

          // Ha van currentUser és Manager/GM/CEO és a műszak véget ért -> ActualHoursModal
          // Különben -> Edit modal
          if (currentUserRef.current && ['Manager', 'GeneralManager', 'CEO'].includes(currentUserRef.current.role) && hasEnded) {
            console.log("  ✅ Opening ActualHoursModal");
            setSelectedShiftForActualHours(clickedShift);
            setIsActualHoursModalOpen(true);
          } else {
            // Csak GeneralManager és CEO szerkeszthet shift-et
            if (!currentUserRef.current || !['GeneralManager', 'CEO'].includes(currentUserRef.current.role)) {
              console.log("  ❌ Shift edit denied - not GM/CEO");
              return;
            }

            console.log("  ✅ Opening Edit Modal");
            // Edit modal (eredeti viselkedés)
            const editData = {
              id: clickedShift.id,
              userId: clickedShift.userId,
              positionId: clickedShift.positionId,
              startTime: clickedShift.startTime,
              endTime: clickedShift.endTime,
              notes: clickedShift.notes || "",
            };

            setEditingShift(editData);
            setIsAddShiftModalOpen(true);
          }
        }
      } else {
        console.log("Shift not found in shifts array!");
      }
    } else if (eventType === 'actual') {
      // Actual hours-ra kattintottak → újra megnyitjuk az ActualHoursModal módosításra
      const shiftData = args.e.data.tags.data;
      const clickedShift = shiftsRef.current.find(shift => shift.id === shiftData.id);

      console.log("⏱️ Actual hours clicked!");
      console.log("  Current user (from ref):", currentUserRef.current?.role);

      // Csak Manager/GM/CEO módosíthatja
      if (currentUserRef.current && ['Manager', 'GeneralManager', 'CEO'].includes(currentUserRef.current.role)) {
        if (clickedShift) {
          console.log("  ✅ Opening ActualHoursModal for editing");
          setSelectedShiftForActualHours(clickedShift);
          setIsActualHoursModalOpen(true);
        }
      } else {
        console.log("  ❌ User is not authorized to edit actual hours");
      }
    }
  };

  // DayPilot konfiguráció
  const [schedulerConfig, setSchedulerConfig] = useState<DayPilot.SchedulerConfig>({
    timeHeaders: [
      { groupBy: "Day", format: "dddd M/d" },
      { groupBy: "Hour", format: "H" } // 24 órás formátum (0-23), "HH" = kétjegyű (00-23)
    ],
    scale: "Hour",
    days: dateParam ? 1 : 7, // Ha van date param, csak 1 nap
    startDate: dateParam ? new DayPilot.Date(dateParam) : new DayPilot.Date(),
    timeRangeSelectedHandling: "Enabled", // Engedélyezzük a drag-and-select funkciót
    eventDeleteHandling: "Disabled",
    eventResizeHandling: "Update", // Engedélyezzük az események átméretezését
    cellWidth: 50, // Óra oszlop szélesség (alapértelmezett 40, növeljük 50-re a jobb olvashatóságért)
    onTimeRangeSelected: async (args: any) => {
      // Csak GeneralManager és CEO drag-elhet új shift-et
      if (!currentUserRef.current || !['GeneralManager', 'CEO'].includes(currentUserRef.current.role)) {
        console.log("❌ Time range selected denied - not GM/CEO");
        args.control.clearSelection();
        return;
      }

      // Amikor a felhasználó kiválaszt egy időtartamot drag-and-select-tel
      console.log("⏰ Time range selected!");
      console.log("  Resource (userId):", args.resource);
      console.log("  Start:", args.start.toString());
      console.log("  End:", args.end.toString());

      // Formázza az időpontokat
      const startDate = new Date(args.start.toString());
      const endDate = new Date(args.end.toString());

      const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
      const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      // Dátum formázása (YYYY-MM-DD) - inline implementáció
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log("  Opening Add Shift Modal with pre-filled data:");
      console.log("    User ID:", args.resource);
      console.log("    Date:", dateStr);
      console.log("    Time:", startTimeStr, "-", endTimeStr);

      // Megnyitjuk az Add Shift modal-t előre kitöltött adatokkal
      // Az editShift-et használjuk hogy "fake edit" módban nyissuk meg
      setEditingShift({
        id: "", // Üres ID = új shift létrehozása
        userId: args.resource, // A kiválasztott user ID-ja
        positionId: null,
        startTime: null, // null marad, de a modal intelligensen kezeli
        endTime: null,
        date: startDate.toISOString(),
        notes: "",
        // Extra információk a modal számára
        _prefilledStartTime: startTimeStr,
        _prefilledEndTime: endTimeStr,
      } as any);

      setIsAddShiftModalOpen(true);

      // Töröljük a kijelölést (ne maradjon kék négyzet)
      args.control.clearSelection();
    },
    onEventResized: async (args: any) => {
      // Csak GeneralManager és CEO méretezhet át shift-et
      if (!currentUserRef.current || !['GeneralManager', 'CEO'].includes(currentUserRef.current.role)) {
        console.log("❌ Event resize denied - not GM/CEO");
        args.preventDefault();
        return;
      }

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
            toast.error(errorMessage);
            // Visszaállítjuk az eredeti állapotot - refresh az oldalt
            window.location.reload();
          } else {
            console.error("Failed to update shift");
            toast.error(language === 'hu' ? 'Nem sikerült frissíteni a műszakot' : 'Failed to update shift');
            // Visszaállítjuk az eredeti állapotot
            args.control.message(language === 'hu' ? 'A frissítés sikertelen volt' : 'Update failed');
          }
        } catch (error) {
          console.error('Error updating shift:', error);
          toast.error(language === 'hu' ? 'Hiba történt a műszak frissítése közben' : 'Error updating shift');
        }
      }
    },
    onEventClick: handleEventClick, // Használjuk a külön definiált handlert
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
        console.log("📅 Schedule loaded:", scheduleData);

        // ShiftRequests lekérése (GM/CEO sees all, Employee sees only their own)
        let requestsData: any[] = [];
        const requestsResponse = await fetch(`/api/schedule/${scheduleId}/shift-requests`);
        if (requestsResponse.ok) {
          requestsData = await requestsResponse.json();
          setShiftRequests(requestsData);
          console.log("📋 ShiftRequests loaded:", requestsData.length, "requests");
        }

        // Műszakok lekérése
        let shiftsData: any[] = [];
        const shiftsResponse = await fetch(`/api/shifts?scheduleId=${scheduleId}`);
        if (shiftsResponse.ok) {
          shiftsData = await shiftsResponse.json();
          setShifts(shiftsData);
          shiftsRef.current = shiftsData; // Frissítjük a ref-et is
          console.log("👷 Shifts loaded:", shiftsData.length, "shifts");
        }

        // Resources (felhasználók) és Events (műszakok + kérések) létrehozása
        const uniqueUsers = new Map();
        const events: any[] = [];

        // Gyűjtsük össze az összes usert (shifts + requests alapján)
        shiftsData.forEach((shift: any) => {
          if (!uniqueUsers.has(shift.userId)) {
            uniqueUsers.set(shift.userId, {
              name: shift.user.name,
              id: shift.userId
            });
          }
        });

        requestsData.forEach((request: any) => {
          if (!uniqueUsers.has(request.userId)) {
            uniqueUsers.set(request.userId, {
              name: request.user?.name || 'Unknown',
              id: request.userId
            });
          }
        });

        console.log("👥 Unique users found:", uniqueUsers.size);

        // ShiftRequest events létrehozása (Row 1)
        requestsData.forEach((request: any) => {
          const requestDate = new Date(request.date);

          if (dateParam) {
            // A request.date mező dátum része (YYYY-MM-DD) local time-ban
            const year = requestDate.getFullYear();
            const month = String(requestDate.getMonth() + 1).padStart(2, '0');
            const day = String(requestDate.getDate()).padStart(2, '0');
            const requestDateStr = `${year}-${month}-${day}`;

            console.log(`🔍 Filtering: request date=${requestDateStr}, dateParam=${dateParam}`);

            if (requestDateStr !== dateParam) {
              console.log(`   ❌ Skipped (date mismatch)`);
              return;
            }
            console.log(`   ✅ Included`);
          }

          let startTime, endTime, text;

          if (request.type === "SPECIFIC_TIME" && request.preferredStartTime) {
            startTime = new Date(request.preferredStartTime);
            endTime = new Date(request.preferredEndTime);
            const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            text = `Request: ${startTimeStr} - ${endTimeStr}`;
          } else if (request.type === "AVAILABLE_ALL_DAY") {
            startTime = new Date(requestDate);
            startTime.setHours(8, 0, 0, 0);
            endTime = new Date(requestDate);
            endTime.setHours(20, 0, 0, 0);
            text = language === 'hu' ? "Elérhető egész nap" : "Available All Day";
          } else { // TIME_OFF
            startTime = new Date(requestDate);
            startTime.setHours(8, 0, 0, 0);
            endTime = new Date(requestDate);
            endTime.setHours(20, 0, 0, 0);
            text = language === 'hu' ? "Szabadság" : "Time Off";
          }

          // Színkódolás és CSS class
          let backColor = '#E5E7EB'; // Light Gray (PENDING)
          let borderColor = 'darker';
          let cssClass = '';

          if (request.type === "TIME_OFF") {
            // TIME_OFF típusú kérések külön színkódolása státusz szerint
            if (request.status === "APPROVED") {
              backColor = '#D1FAE5'; // Light Green
              borderColor = '#10B981'; // Green border (3px vastag)
              cssClass = 'daypilot-event-approved';
            } else if (request.status === "REJECTED") {
              backColor = '#FEE2E2'; // Light Red
              borderColor = '#EF4444'; // Red border (3px vastag)
              cssClass = 'daypilot-event-rejected';
            } else {
              // PENDING
              backColor = '#FEF3C7'; // Light Orange/Yellow
              borderColor = '#F59E0B'; // Orange border
              cssClass = 'daypilot-event-pending';
            }
          } else if (request.status === "APPROVED") {
            backColor = '#D1FAE5'; // Light Green
            borderColor = '#10B981'; // Green border
            cssClass = 'daypilot-event-approved';
          } else if (request.status === "REJECTED") {
            backColor = '#FEE2E2'; // Light Red
            borderColor = '#EF4444'; // Red border
            cssClass = 'daypilot-event-rejected';
          }

          // DayPilot LOCAL TIME formátum (YYYY-MM-DDTHH:mm:ss, Z nélkül)
          const startStr = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}-${String(startTime.getDate()).padStart(2, '0')}T${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}:${String(startTime.getSeconds()).padStart(2, '0')}`;
          const endStr = `${endTime.getFullYear()}-${String(endTime.getMonth() + 1).padStart(2, '0')}-${String(endTime.getDate()).padStart(2, '0')}T${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}:${String(endTime.getSeconds()).padStart(2, '0')}`;

          console.log(`📋 Creating request event: ${request.type} for ${request.user?.name} on ${requestDate.toISOString().split('T')[0]}`);
          console.log(`   Start: ${startStr}, End: ${endStr}`);

          events.push({
            id: `request_${request.id}`,
            start: startStr,
            end: endStr,
            resource: request.userId, // Egyszerűsített - direkt userId
            text: text,
            backColor: backColor,
            borderColor: borderColor,
            cssClass: cssClass,
            tags: { type: 'request', data: request }
          });
        });

        // Shift events létrehozása (Row 2)
        shiftsData.forEach((shift: any) => {
          const shiftDate = new Date(shift.date);

          if (dateParam) {
            const year = shiftDate.getFullYear();
            const month = String(shiftDate.getMonth() + 1).padStart(2, '0');
            const day = String(shiftDate.getDate()).padStart(2, '0');
            const shiftDateStr = `${year}-${month}-${day}`;

            if (shiftDateStr !== dateParam) {
              return;
            }
          }

          // Ha nincs még kitöltve az időpont (placeholder shift) -> ne jelenítsük meg
          if (!shift.startTime || !shift.endTime) {
            return; // Skip placeholder shifts - ne jelenjenek meg a naptárban
          }

          // Normál shift (van startTime és endTime)
          const positionName = (shift.position.displayNames as any)?.[language] || shift.position.name;
          const startTime = new Date(shift.startTime);
          const endTime = new Date(shift.endTime);
          const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          // DayPilot LOCAL TIME formátum (YYYY-MM-DDTHH:mm:ss, Z nélkül)
          const startStr = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}-${String(startTime.getDate()).padStart(2, '0')}T${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}:${String(startTime.getSeconds()).padStart(2, '0')}`;
          const endStr = `${endTime.getFullYear()}-${String(endTime.getMonth() + 1).padStart(2, '0')}-${String(endTime.getDate()).padStart(2, '0')}T${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}:${String(endTime.getSeconds()).padStart(2, '0')}`;

          console.log(`👷 Creating shift event: ${positionName} for ${shift.user?.name} - ${startTimeStr} to ${endTimeStr}`);
          console.log(`   Start: ${startStr}, End: ${endStr}`);

          events.push({
            id: shift.id,
            start: startStr,
            end: endStr,
            resource: shift.userId, // Egyszerűsített - direkt userId
            text: `${positionName}: ${startTimeStr} - ${endTimeStr}`,
            backColor: shift.position.color || '#3B82F6',
            borderColor: 'darker',
            tags: { type: 'shift', data: shift }
          });

          // Actual Hours events létrehozása - shift.actualWorkHours objektumból
          if (shift.actualWorkHours) {
            const actualHours = shift.actualWorkHours;
            let actualBackColor = '#4B5563'; // Dark Gray (PRESENT)
            let actualText = '';

            if (actualHours.status === 'PRESENT' && actualHours.actualStartTime && actualHours.actualEndTime) {
              const actualStart = new Date(actualHours.actualStartTime);
              const actualEnd = new Date(actualHours.actualEndTime);
              const actualStartStr = actualStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const actualEndStr = actualEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              actualText = `Actual: ${actualStartStr} - ${actualEndStr}`;
              actualBackColor = '#4B5563'; // Dark Gray

              const actualStartStr2 = `${actualStart.getFullYear()}-${String(actualStart.getMonth() + 1).padStart(2, '0')}-${String(actualStart.getDate()).padStart(2, '0')}T${String(actualStart.getHours()).padStart(2, '0')}:${String(actualStart.getMinutes()).padStart(2, '0')}:${String(actualStart.getSeconds()).padStart(2, '0')}`;
              const actualEndStr2 = `${actualEnd.getFullYear()}-${String(actualEnd.getMonth() + 1).padStart(2, '0')}-${String(actualEnd.getDate()).padStart(2, '0')}T${String(actualEnd.getHours()).padStart(2, '0')}:${String(actualEnd.getMinutes()).padStart(2, '0')}:${String(actualEnd.getSeconds()).padStart(2, '0')}`;

              events.push({
                id: `actual_${shift.id}`,
                start: actualStartStr2,
                end: actualEndStr2,
                resource: shift.userId,
                text: actualText,
                backColor: actualBackColor,
                borderColor: 'darker',
                tags: { type: 'actual', data: shift }
              });
            } else if (actualHours.status === 'SICK') {
              // SICK - 8 AM to 8 PM block
              actualText = language === 'hu' ? 'Beteg' : 'Sick';
              actualBackColor = '#FCD34D'; // Yellow

              const shiftDate = new Date(shift.date);
              const dayStart = new Date(shiftDate);
              dayStart.setHours(8, 0, 0, 0);
              const dayEnd = new Date(shiftDate);
              dayEnd.setHours(20, 0, 0, 0);

              const sickStartStr = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}T${String(dayStart.getHours()).padStart(2, '0')}:${String(dayStart.getMinutes()).padStart(2, '0')}:${String(dayStart.getSeconds()).padStart(2, '0')}`;
              const sickEndStr = `${dayEnd.getFullYear()}-${String(dayEnd.getMonth() + 1).padStart(2, '0')}-${String(dayEnd.getDate()).padStart(2, '0')}T${String(dayEnd.getHours()).padStart(2, '0')}:${String(dayEnd.getMinutes()).padStart(2, '0')}:${String(dayEnd.getSeconds()).padStart(2, '0')}`;

              events.push({
                id: `actual_${shift.id}`,
                start: sickStartStr,
                end: sickEndStr,
                resource: shift.userId,
                text: actualText,
                backColor: actualBackColor,
                borderColor: 'darker',
                tags: { type: 'actual', data: shift }
              });
            } else if (actualHours.status === 'ABSENT') {
              // ABSENT - 8 AM to 8 PM block
              actualText = language === 'hu' ? 'Hiányzott' : 'Absent';
              actualBackColor = '#EF4444'; // Red

              const shiftDate = new Date(shift.date);
              const dayStart = new Date(shiftDate);
              dayStart.setHours(8, 0, 0, 0);
              const dayEnd = new Date(shiftDate);
              dayEnd.setHours(20, 0, 0, 0);

              const absentStartStr = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}T${String(dayStart.getHours()).padStart(2, '0')}:${String(dayStart.getMinutes()).padStart(2, '0')}:${String(dayStart.getSeconds()).padStart(2, '0')}`;
              const absentEndStr = `${dayEnd.getFullYear()}-${String(dayEnd.getMonth() + 1).padStart(2, '0')}-${String(dayEnd.getDate()).padStart(2, '0')}T${String(dayEnd.getHours()).padStart(2, '0')}:${String(dayEnd.getMinutes()).padStart(2, '0')}:${String(dayEnd.getSeconds()).padStart(2, '0')}`;

              events.push({
                id: `actual_${shift.id}`,
                start: absentStartStr,
                end: absentEndStr,
                resource: shift.userId,
                text: actualText,
                backColor: actualBackColor,
                borderColor: 'darker',
                tags: { type: 'actual', data: shift }
              });
            }
          }
        });

        // Resources létrehozása - EGYSZERŰSÍTETT (csak 1 sor per user, children nélkül)
        const resources = Array.from(uniqueUsers.values()).map(user => ({
          name: user.name,
          id: user.id
        }));

        console.log("📊 Resources created:", resources.length);
        console.log("📊 Resources:", resources);
        console.log("🎯 Events created:", events.length);
        console.log("🎯 Events:", events);

        const newConfig = {
          ...schedulerConfig,
          startDate: dateParam || scheduleData.weekStart,
          days: dateParam ? 1 : 7,
          resources: resources.length > 0 ? resources : [{ name: "No data yet", id: "empty" }],
          events: events
        };

        console.log("⚙️ New scheduler config:");
        console.log("  - startDate:", newConfig.startDate);
        console.log("  - days:", newConfig.days);
        console.log("  - resources.length:", newConfig.resources.length);
        console.log("  - events.length:", newConfig.events.length);

        setSchedulerConfig(newConfig);

        console.log("✅ Scheduler config updated!");

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

  // Helper: Date objektumot lokális YYYY-MM-DD stringre konvertál (UTC nélkül)
  const formatDateToLocalString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
        selectedDate={editingShift ? (editingShift.date ? formatDateToLocalString(new Date(editingShift.date)) : (editingShift.startTime ? formatDateToLocalString(new Date(editingShift.startTime)) : (dateParam || formatDateToLocalString(new Date(schedule?.weekStart || new Date()))))) : (dateParam || formatDateToLocalString(new Date(schedule?.weekStart || new Date())))}
        weekStart={schedule?.weekStart ? new Date(schedule.weekStart) : undefined}
        weekEnd={schedule?.weekEnd ? new Date(schedule.weekEnd) : undefined}
        editShift={editingShift}
      />

      {/* Review Request Modal - szabadság egyenleg megjelenítésével */}
      {isReviewModalOpen && selectedRequest && (
        <ReviewRequestModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Convert Request Modal - SPECIFIC_TIME/AVAILABLE_ALL_DAY konvertálásához */}
      {selectedRequest && (
        <ConvertRequestModal
          isOpen={isConvertModalOpen}
          onClose={() => {
            setIsConvertModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={() => {
            setIsConvertModalOpen(false);
            setSelectedRequest(null);
            // Újratöltjük az adatokat
            window.location.reload();
          }}
        />
      )}

      {/* Actual Hours Modal */}
      {selectedShiftForActualHours && (
        <ActualHoursModal
          isOpen={isActualHoursModalOpen}
          onClose={() => {
            setIsActualHoursModalOpen(false);
            setSelectedShiftForActualHours(null);
          }}
          shift={selectedShiftForActualHours}
          onSuccess={() => {
            setIsActualHoursModalOpen(false);
            setSelectedShiftForActualHours(null);
            // Újratöltjük az adatokat
            window.location.reload();
          }}
        />
      )}

      {/* Mobile View */}
      <div className="block lg:hidden h-full bg-white overflow-y-auto pb-20">
        <ScheduleMobileHeader
          onBack={() => router.push('/schedule')}
          title={t.week}
          showAddButton={currentUser && ['GeneralManager', 'CEO'].includes(currentUser.role)}
          showPublishButton={currentUser && ['GeneralManager', 'CEO'].includes(currentUser.role)}
          onAdd={() => {
            setEditingShift(null);
            setIsAddShiftModalOpen(true);
          }}
          onPublish={handlePublish}
          isPublished={schedule?.isPublished || false}
          canManage={currentUser && ['GeneralManager', 'CEO'].includes(currentUser.role)}
        />
        <ScheduleMobileDayView
          scheduleData={{ shifts, shiftRequests }}
          weekStart={schedule?.weekStart ? new Date(schedule.weekStart) : new Date()}
          weekEnd={schedule?.weekEnd ? new Date(schedule.weekEnd) : new Date()}
          canManage={currentUser && ['GeneralManager', 'CEO'].includes(currentUser.role)}
          onEditShift={(shiftId) => {
            const clickedShift = shiftsRef.current.find(shift => shift.id === shiftId);
            if (clickedShift) {
              const editData = {
                id: clickedShift.id,
                userId: clickedShift.userId,
                positionId: clickedShift.positionId,
                startTime: clickedShift.startTime,
                endTime: clickedShift.endTime,
                notes: clickedShift.notes || "",
              };
              setEditingShift(editData);
              setIsAddShiftModalOpen(true);
            }
          }}
          onDeleteShift={handleDeleteShift}
          onConvertRequest={(request) => {
            console.log("Mobile: Convert request clicked", request);
            setSelectedRequest(request);
            setIsConvertModalOpen(true);
          }}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block lg:pl-80 h-full">
        <div className="h-full flex flex-col">
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
                    <>
                      <p className="text-sm text-gray-600">
                        {formatWeek(schedule.weekStart, schedule.weekEnd)}
                      </p>
                      {schedule.requestDeadline && (
                        <p className="text-xs mt-1">
                          {new Date() > new Date(schedule.requestDeadline) ? (
                            <span className="text-red-600">
                              {language === 'hu' ? 'Kérési határidő lejárt' : 'Request deadline passed'}: {new Date(schedule.requestDeadline).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US')}
                            </span>
                          ) : (
                            <span className="text-green-600">
                              {language === 'hu' ? 'Kérések nyitva' : 'Requests open'}: {new Date(schedule.requestDeadline).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US')}
                            </span>
                          )}
                        </p>
                      )}
                      {!schedule.requestDeadline && (
                        <p className="text-xs text-gray-500 mt-1">
                          {language === 'hu' ? 'Nincs kérési határidő' : 'No request deadline'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Add Shift Button */}
                {currentUser && ['GeneralManager', 'CEO'].includes(currentUser.role) && (
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
                )}

                {/* Publish/Unpublish Button - Only for GM/CEO */}
                {currentUser && ['GeneralManager', 'CEO'].includes(currentUser.role) && (
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition ${
                      schedule.isPublished
                        ? "bg-gray-500 text-white hover:bg-gray-600"
                        : "bg-green-600 text-white hover:bg-green-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isPublishing
                      ? (schedule.isPublished ? t.unpublishing : t.publishing)
                      : (schedule.isPublished ? t.unpublish : t.publish)
                    }
                  </button>
                )}

                <span
                  className={`text-xs px-3 py-1 rounded-full ${schedule.isPublished
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {schedule.isPublished ? t.published : t.draft}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 bg-nexus-bg overflow-auto">
            {/* DayPilot Scheduler */}
            <div className="bg-white rounded-lg shadow">
              <DayPilotScheduler
                key={`scheduler-${schedulerConfig.resources?.length || 0}-${schedulerConfig.events?.length || 0}`}
                {...schedulerConfig}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
