"use client";

import { User } from "@prisma/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import Modal from "@/app/components/Modal";
import { HiClock } from "react-icons/hi2";

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  selectedDate: string; // YYYY-MM-DD formátum
}

const AddShiftModal: React.FC<AddShiftModalProps> = ({
  isOpen,
  onClose,
  scheduleId,
  selectedDate,
}) => {
  const router = useRouter();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [notes, setNotes] = useState("");

  // Kiválasztott user alapján elérhető pozíciók
  const selectedUser = users.find(u => u.id === selectedUserId);
  const availablePositions = selectedUser?.userPositions?.map((up: any) => up.position) || [];

  // Fordítások
  const translations = {
    en: {
      title: "Add Shift",
      selectUser: "Select Employee",
      selectUserPlaceholder: "Choose an employee",
      selectPosition: "Select Position",
      selectPositionPlaceholder: "Choose a position",
      startTime: "Start Time",
      endTime: "End Time",
      notes: "Notes (optional)",
      notesPlaceholder: "Additional notes...",
      addButton: "Add Shift",
      cancelButton: "Cancel",
      adding: "Adding...",
      error: "Failed to add shift",
      success: "Shift added successfully!",
      validation: {
        selectUser: "Please select an employee",
        selectPosition: "Please select a position",
        invalidTime: "End time must be after start time"
      }
    },
    hu: {
      title: "Műszak hozzáadása",
      selectUser: "Válassz alkalmazottat",
      selectUserPlaceholder: "Válassz egy alkalmazottat",
      selectPosition: "Válassz pozíciót",
      selectPositionPlaceholder: "Válassz egy pozíciót",
      startTime: "Kezdés időpontja",
      endTime: "Befejezés időpontja",
      notes: "Megjegyzések (opcionális)",
      notesPlaceholder: "További megjegyzések...",
      addButton: "Műszak hozzáadása",
      cancelButton: "Mégse",
      adding: "Hozzáadás...",
      error: "Nem sikerült hozzáadni a műszakot",
      success: "Műszak sikeresen hozzáadva!",
      validation: {
        selectUser: "Kérlek válassz egy alkalmazottat",
        selectPosition: "Kérlek válassz egy pozíciót",
        invalidTime: "A befejezés időpontja a kezdés után kell legyen"
      }
    },
  };

  const t = translations[language];

  // Felhasználók lekérése
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      // Felhasználók lekérése
      const usersResponse = await fetch('/api/schedule/users');

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();

        // Szűrjük ki a törölt usereket és csak aktív dolgozókat vegyünk
        const activeUsers = usersData.filter((user: any) =>
          !user.deletedAt && user.userPositions && user.userPositions.length > 0
        );

        setUsers(activeUsers);
      } else {
        console.error('Failed to fetch users:', usersResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Órák kiszámítása
  const calculateHours = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return (endMinutes - startMinutes) / 60;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validáció
    if (!selectedUserId) {
      alert(t.validation.selectUser);
      return;
    }

    if (!selectedPositionId) {
      alert(t.validation.selectPosition);
      return;
    }

    if (startTime >= endTime) {
      alert(t.validation.invalidTime);
      return;
    }

    setIsLoading(true);

    try {
      // DateTime objektumok létrehozása
      const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
      const endDateTime = new Date(`${selectedDate}T${endTime}:00`);
      const hoursWorked = calculateHours();

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekScheduleId: scheduleId,
          userId: selectedUserId,
          positionId: selectedPositionId,
          date: new Date(selectedDate).toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          hoursWorked,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add shift');
      }

      // Bezárjuk a modalt és frissítjük az oldalt
      onClose();
      router.refresh();

      // Reset form
      setSelectedUserId("");
      setSelectedPositionId("");
      setStartTime("08:00");
      setEndTime("16:00");
      setNotes("");
    } catch (error) {
      console.error('Error adding shift:', error);
      alert(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-nexus-primary rounded-lg">
              <HiClock className="h-6 w-6 text-nexus-tertiary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
              <p className="text-sm text-gray-600">
                {new Date(selectedDate).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* User Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.selectUser}
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                // Reset position when user changes
                setSelectedPositionId("");
              }}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent disabled:opacity-50"
              required
            >
              <option value="">{t.selectUserPlaceholder}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Position Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.selectPosition}
            </label>
            <select
              value={selectedPositionId}
              onChange={(e) => setSelectedPositionId(e.target.value)}
              disabled={isLoading || !selectedUserId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent disabled:opacity-50"
              required
            >
              <option value="">{t.selectPositionPlaceholder}</option>
              {availablePositions.map((position: any) => (
                <option key={position.id} value={position.id}>
                  {(position.displayNames as any)?.[language] || position.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.startTime}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.endTime}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Hours Preview */}
          {startTime && endTime && startTime < endTime && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>{language === 'hu' ? 'Munkaidő:' : 'Working hours:'}</strong>{' '}
                {calculateHours().toFixed(2)} {language === 'hu' ? 'óra' : 'hours'}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent disabled:opacity-50"
              placeholder={t.notesPlaceholder}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {t.cancelButton}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary hover:bg-nexus-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t.adding : t.addButton}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddShiftModal;
