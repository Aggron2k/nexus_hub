"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ShiftRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekScheduleId: string;
  weekStart: Date;
  weekEnd: Date;
  selectedDate?: Date;
  requestDeadline: Date;
  onSuccess?: () => void;
}

type RequestType = "SPECIFIC_TIME" | "AVAILABLE_ALL_DAY" | "TIME_OFF";

export default function ShiftRequestModal({
  isOpen,
  onClose,
  weekScheduleId,
  weekStart,
  weekEnd,
  selectedDate,
  requestDeadline,
  onSuccess,
}: ShiftRequestModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Format dates for input min/max
  const minDate = new Date(weekStart).toISOString().split("T")[0];
  const maxDate = new Date(weekEnd).toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    type: "SPECIFIC_TIME" as RequestType,
    date: selectedDate ? selectedDate.toISOString().split("T")[0] : minDate,
    startTime: "07:00",
    endTime: "15:00",
    notes: "",
  });

  // Check if deadline has passed (only if deadline exists)
  const isDeadlinePassed = requestDeadline ? new Date() > new Date(requestDeadline) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validáció
      if (!formData.date) {
        toast.error("Válassz dátumot");
        setIsLoading(false);
        return;
      }

      // Dátum és időpont összeállítása
      const requestDate = new Date(formData.date);
      let startDateTime = null;
      let endDateTime = null;

      if (formData.type === "SPECIFIC_TIME") {
        const [startHours, startMinutes] = formData.startTime.split(":");
        const [endHours, endMinutes] = formData.endTime.split(":");

        startDateTime = new Date(requestDate);
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);

        endDateTime = new Date(requestDate);
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

        if (startDateTime >= endDateTime) {
          toast.error("A befejező időnek később kell lennie, mint a kezdő idő");
          setIsLoading(false);
          return;
        }
      }

      const response = await axios.post("/api/shift-requests", {
        weekScheduleId,
        type: formData.type,
        date: requestDate.toISOString(),
        preferredStartTime: startDateTime?.toISOString(),
        preferredEndTime: endDateTime?.toISOString(),
        notes: formData.notes || null,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Műszak kérés sikeresen elküldve");
        resetForm();
        onClose();
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error("Error submitting shift request:", error);
      if (error.response?.status === 409) {
        const errorMessage = error.response.data;
        toast.error(errorMessage);
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data;
        toast.error(errorMessage);
      } else {
        toast.error("Hiba történt a kérés beküldése során");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "SPECIFIC_TIME",
      date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
      startTime: "07:00",
      endTime: "15:00",
      notes: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Műszak kérés beküldése
          </h2>
          {requestDeadline && isDeadlinePassed && (
            <p className="text-sm text-red-600 mt-1">
              Figyelem: A határidő lejárt ({new Date(requestDeadline).toLocaleString("hu-HU")})
            </p>
          )}
          {!requestDeadline && (
            <p className="text-sm text-yellow-600 mt-1">
              Nincs határidő beállítva ehhez a héthez
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              A pozíciót a menedzser fogja kijelölni a kérés jóváhagyásakor.
            </p>
          </div>

          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kérés típusa *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as RequestType,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
              required
              disabled={isLoading || isDeadlinePassed}
            >
              <option value="SPECIFIC_TIME">Konkrét időpont</option>
              <option value="AVAILABLE_ALL_DAY">Egész nap elérhető vagyok</option>
              <option value="TIME_OFF">Szabadság / Időkérés</option>
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dátum * ({new Date(weekStart).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })} - {new Date(weekEnd).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })})
            </label>
            <input
              type="date"
              value={formData.date}
              min={minDate}
              max={maxDate}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
              required
              disabled={isLoading || isDeadlinePassed}
            />
          </div>

          {/* Time Selection (only for SPECIFIC_TIME) */}
          {formData.type === "SPECIFIC_TIME" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kezdés *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
                  required
                  disabled={isLoading || isDeadlinePassed}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Befejezés *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
                  required
                  disabled={isLoading || isDeadlinePassed}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Megjegyzések
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
              placeholder="Opcionális megjegyzések..."
              disabled={isLoading || isDeadlinePassed}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            Mégse
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary rounded-md hover:bg-nexus-tertiary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isDeadlinePassed}
          >
            {isLoading ? "Küldés..." : "Kérés beküldése"}
          </button>
        </div>
      </div>
    </div>
  );
}
