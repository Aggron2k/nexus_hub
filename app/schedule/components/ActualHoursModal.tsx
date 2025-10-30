"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HiXMark, HiClock } from "react-icons/hi2";

interface ActualHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: any;
  onSuccess: () => void;
}

export default function ActualHoursModal({
  isOpen,
  onClose,
  shift,
  onSuccess,
}: ActualHoursModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    actualStatus: shift?.actualWorkHours?.status || "PRESENT",
    actualStartTime: "",
    actualEndTime: "",
  });

  useEffect(() => {
    if (shift && isOpen) {
      // Pre-fill with existing actual hours if available
      if (shift.actualWorkHours && shift.actualWorkHours.actualStartTime && shift.actualWorkHours.actualEndTime) {
        const startTime = new Date(shift.actualWorkHours.actualStartTime);
        const endTime = new Date(shift.actualWorkHours.actualEndTime);
        setFormData({
          actualStatus: shift.actualWorkHours.status || "PRESENT",
          actualStartTime: startTime.toTimeString().slice(0, 5),
          actualEndTime: endTime.toTimeString().slice(0, 5),
        });
      } else if (shift.actualWorkHours && shift.actualWorkHours.status) {
        // Már van actualWorkHours de csak status (SICK/ABSENT)
        setFormData({
          actualStatus: shift.actualWorkHours.status,
          actualStartTime: "",
          actualEndTime: "",
        });
      } else {
        // Nincs még actualWorkHours - Pre-fill with planned times
        const startTime = new Date(shift.startTime);
        const endTime = new Date(shift.endTime);
        setFormData({
          actualStatus: "PRESENT",
          actualStartTime: startTime.toTimeString().slice(0, 5),
          actualEndTime: endTime.toTimeString().slice(0, 5),
        });
      }
    }
  }, [shift, isOpen]);

  if (!isOpen || !shift) return null;

  // Check if shift has ended
  const now = new Date();
  const shiftEnd = new Date(shift.endTime);
  const hasEnded = now > shiftEnd;

  if (!hasEnded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Tényleges munkaórák
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <HiXMark className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            A tényleges munkaórákat csak a műszak befejezése után lehet rögzíteni.
          </p>
          <p className="text-sm text-gray-800 mt-2">
            Műszak vége: {shiftEnd.toLocaleString("hu-HU")}
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary rounded-md hover:bg-nexus-primary"
          >
            Rendben
          </button>
        </div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "Jelen volt";
      case "SICK":
        return "Beteg";
      case "ABSENT":
        return "Hiányzott";
      default:
        return status;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.actualStatus === "PRESENT") {
      if (!formData.actualStartTime || !formData.actualEndTime) {
        toast.error("Kérlek add meg a kezdő és befejező időpontot");
        return;
      }

      // Validáció: actualStartTime < actualEndTime
      const [startHour, startMin] = formData.actualStartTime.split(":").map(Number);
      const [endHour, endMin] = formData.actualEndTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        toast.error("A kezdő időpont korábbi kell legyen mint a befejező");
        return;
      }
    }

    setIsLoading(true);

    try {
      const shiftDate = new Date(shift.date);
      const bodyData: any = {
        actualStatus: formData.actualStatus,
      };

      if (formData.actualStatus === "PRESENT") {
        const [startHour, startMin] = formData.actualStartTime.split(":");
        const [endHour, endMin] = formData.actualEndTime.split(":");

        const actualStartDateTime = new Date(shiftDate);
        actualStartDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

        const actualEndDateTime = new Date(shiftDate);
        actualEndDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

        bodyData.actualStartTime = actualStartDateTime.toISOString();
        bodyData.actualEndTime = actualEndDateTime.toISOString();
      }

      await axios.patch(`/api/shifts/${shift.id}`, bodyData);

      toast.success("Tényleges munkaórák sikeresen rögzítve");
      onClose();
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error recording actual hours:", error);
      if (error.response?.status === 400) {
        toast.error(error.response.data);
      } else {
        toast.error("Hiba történt a rögzítés során");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Tényleges munkaórák rögzítése
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* Shift Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Alkalmazott</p>
                  <p className="text-base font-medium text-gray-900">
                    {shift.user?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pozíció</p>
                  <p className="text-base font-medium text-gray-900">
                    {shift.position?.displayNames?.hu || shift.position?.name}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Dátum</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(shift.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tervezett kezdés</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(shift.startTime).toLocaleTimeString("hu-HU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tervezett befejezés</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(shift.endTime).toLocaleTimeString("hu-HU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Státusz *
              </label>
              <select
                value={formData.actualStatus}
                onChange={(e) =>
                  setFormData({ ...formData, actualStatus: e.target.value })
                }
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
              >
                <option value="PRESENT">Jelen volt</option>
                <option value="SICK">Beteg</option>
                <option value="ABSENT">Hiányzott</option>
              </select>
            </div>

            {/* Time Inputs - Only for PRESENT */}
            {formData.actualStatus === "PRESENT" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tényleges kezdés *
                  </label>
                  <input
                    type="time"
                    value={formData.actualStartTime}
                    onChange={(e) =>
                      setFormData({ ...formData, actualStartTime: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tényleges befejezés *
                  </label>
                  <input
                    type="time"
                    value={formData.actualEndTime}
                    onChange={(e) =>
                      setFormData({ ...formData, actualEndTime: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nexus-tertiary"
                    required
                  />
                </div>
              </div>
            )}

            {/* Info Messages */}
            {formData.actualStatus === "SICK" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Betegség esetén nincs szükség időpontok megadására.
                </p>
              </div>
            )}
            {formData.actualStatus === "ABSENT" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  Hiányzás esetén nincs szükség időpontok megadására.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary rounded-md hover:bg-nexus-primary"
            >
              {isLoading ? "Rögzítés..." : "Rögzítés"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
