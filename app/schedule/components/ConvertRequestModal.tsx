"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HiX } from "react-icons/hi";

interface ConvertRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any; // ShiftRequest with user and userPositions included
  onSuccess?: () => void;
}

export default function ConvertRequestModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: ConvertRequestModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    positionId: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  // Reset form when request changes
  useEffect(() => {
    if (request && isOpen) {
      // Ha SPECIFIC_TIME típusú és van preferredStartTime/EndTime, használjuk azt
      if (request.type === "SPECIFIC_TIME" && request.preferredStartTime) {
        const startTime = new Date(request.preferredStartTime);
        const endTime = new Date(request.preferredEndTime);

        setFormData({
          positionId: "",
          startTime: startTime.toTimeString().slice(0, 5), // HH:MM format
          endTime: endTime.toTimeString().slice(0, 5),
          notes: request.notes || "",
        });
      } else {
        // Alapértelmezett időpontok
        setFormData({
          positionId: "",
          startTime: "07:00",
          endTime: "15:00",
          notes: request.notes || "",
        });
      }

      // Fetch employee's positions
      if (request.user?.userPositions) {
        const userPositions = request.user.userPositions.map((up: any) => up.position);
        setPositions(userPositions);

        // Automatikusan kiválasztjuk a primary pozíciót ha van
        const primaryPosition = request.user.userPositions.find((up: any) => up.isPrimary);
        if (primaryPosition) {
          setFormData(prev => ({
            ...prev,
            positionId: primaryPosition.positionId
          }));
        }
      }
    }
  }, [request, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validáció
      if (!formData.positionId) {
        toast.error("Válassz pozíciót");
        setIsLoading(false);
        return;
      }

      // Dátum és időpont összeállítása
      const requestDate = new Date(request.date);
      const [startHours, startMinutes] = formData.startTime.split(":");
      const [endHours, endMinutes] = formData.endTime.split(":");

      const startDateTime = new Date(requestDate);
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);

      const endDateTime = new Date(requestDate);
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

      console.log("🚀 Converting request to shift:");
      console.log("  formData.startTime:", formData.startTime);
      console.log("  formData.endTime:", formData.endTime);
      console.log("  startDateTime:", startDateTime.toISOString());
      console.log("  endDateTime:", endDateTime.toISOString());

      if (startDateTime >= endDateTime) {
        toast.error("A befejező időnek később kell lennie, mint a kezdő idő");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `/api/shift-requests/${request.id}/convert`,
        {
          positionId: formData.positionId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: formData.notes || null,
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Műszak sikeresen létrehozva");
        onClose();
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error("Error converting request:", error);
      if (error.response?.status === 409) {
        const errorMessage = error.response.data;
        toast.error(errorMessage);
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data;
        toast.error(errorMessage);
      } else {
        toast.error("Hiba történt a konvertálás során");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "SPECIFIC_TIME":
        return "Konkrét időpont";
      case "AVAILABLE_ALL_DAY":
        return "Egész nap elérhető";
      case "TIME_OFF":
        return "Szabadság";
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Kérés konvertálása műszakká
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        {/* Employee Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Alkalmazott:</span>{" "}
              <span className="text-gray-900">{request.user?.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dátum:</span>{" "}
              <span className="text-gray-900">{formatDate(request.date)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Típus:</span>{" "}
              <span className="text-gray-900">{getTypeLabel(request.type)}</span>
            </div>
            {request.type === "SPECIFIC_TIME" && request.preferredStartTime && (
              <div>
                <span className="font-medium text-gray-700">Kért időpont:</span>{" "}
                <span className="text-gray-900">
                  {new Date(request.preferredStartTime).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(request.preferredEndTime).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
            {request.notes && (
              <div>
                <span className="font-medium text-gray-700">Megjegyzés:</span>{" "}
                <span className="text-gray-900 italic">{request.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Position Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pozíció * <span className="text-xs text-gray-500">(csak az alkalmazott pozíciói)</span>
            </label>
            <select
              value={formData.positionId}
              onChange={(e) =>
                setFormData({ ...formData, positionId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
              required
              disabled={isLoading}
            >
              <option value="">Válassz pozíciót...</option>
              {positions.map((position) => {
                const isPrimary = request.user?.userPositions?.find(
                  (up: any) => up.positionId === position.id && up.isPrimary
                );
                return (
                  <option key={position.id} value={position.id}>
                    {position.displayNames?.hu || position.name}
                    {isPrimary ? " (Elsődleges)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Time Selection */}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>

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
              disabled={isLoading}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            Mégse
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary rounded-md hover:bg-nexus-tertiary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Létrehozás..." : "Műszak létrehozása"}
          </button>
        </div>
      </div>
    </div>
  );
}
