"use client";

import { User } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import Modal from "@/app/components/Modal";
import { HiCalendar } from "react-icons/hi2";

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const NewScheduleModal: React.FC<NewScheduleModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const router = useRouter();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [weekStart, setWeekStart] = useState("");

  // Fordítások
  const translations = {
    en: {
      title: "Create New Weekly Schedule",
      weekStartLabel: "Week Start Date (Monday)",
      weekStartPlaceholder: "Select Monday",
      createButton: "Create Schedule",
      cancelButton: "Cancel",
      creating: "Creating...",
      selectMonday: "Please select a Monday",
      error: "Failed to create schedule",
      success: "Schedule created successfully!"
    },
    hu: {
      title: "Új heti beosztás létrehozása",
      weekStartLabel: "Hét kezdete (hétfő)",
      weekStartPlaceholder: "Válassz egy hétfőt",
      createButton: "Beosztás létrehozása",
      cancelButton: "Mégse",
      creating: "Létrehozás...",
      selectMonday: "Kérlek válassz egy hétfőt",
      error: "Nem sikerült létrehozni a beosztást",
      success: "Beosztás sikeresen létrehozva!"
    },
  };

  const t = translations[language];

  // Hétfő ellenőrzése
  const isMonday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDay() === 1; // 1 = Monday
  };

  // Hét vége számítása (vasárnap)
  const getWeekEnd = (mondayStr: string) => {
    const monday = new Date(mondayStr);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weekStart) {
      alert(t.selectMonday);
      return;
    }

    if (!isMonday(weekStart)) {
      alert(t.selectMonday);
      return;
    }

    setIsLoading(true);

    try {
      const weekEnd = getWeekEnd(weekStart);

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: new Date(weekStart).toISOString(),
          weekEnd: new Date(weekEnd).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }

      const data = await response.json();

      // Bezárjuk a modalt és navigálunk az új beosztáshoz
      onClose();
      router.push(`/schedule/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating schedule:', error);
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
              <HiCalendar className="h-6 w-6 text-nexus-tertiary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
          </div>

          {/* Week Start Input */}
          <div>
            <label
              htmlFor="weekStart"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.weekStartLabel}
            </label>
            <input
              type="date"
              id="weekStart"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent disabled:opacity-50"
              placeholder={t.weekStartPlaceholder}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {language === 'hu'
                ? 'Automatikusan kiszámítjuk a hét végét (vasárnap)'
                : 'We will automatically calculate the week end (Sunday)'}
            </p>
          </div>

          {/* Preview */}
          {weekStart && isMonday(weekStart) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>{language === 'hu' ? 'Hét:' : 'Week:'}</strong>{' '}
                {new Date(weekStart).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}{' '}
                -{' '}
                {new Date(getWeekEnd(weekStart)).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Warning if not Monday */}
          {weekStart && !isMonday(weekStart) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                {t.selectMonday}
              </p>
            </div>
          )}

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
              disabled={isLoading || !weekStart || !isMonday(weekStart)}
              className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary hover:bg-nexus-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t.creating : t.createButton}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewScheduleModal;
