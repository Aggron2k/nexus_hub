"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Modal from "@/app/components/Modal";
import { HiCheck, HiXMark, HiCalendar, HiCheckCircle, HiClock, HiExclamationTriangle, HiDocumentText } from "react-icons/hi2";

interface VacationBalance {
  annualVacationDays: number;
  usedVacationDays: number;
  pendingDays: number;
  remainingDays: number;
  availableDays: number;
  vacationYear: number;
  usagePercentage: number;
}

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSuccess: () => void;
}

export default function ReviewRequestModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: ReviewRequestModalProps) {
  const router = useRouter();
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [shiftTimes, setShiftTimes] = useState({
    startTime: "",
    endTime: ""
  });
  const [positions, setPositions] = useState<any[]>([]);
  const [positionId, setPositionId] = useState("");
  const [notes, setNotes] = useState("");

  // Betöltjük a szabadság egyenleget TIME_OFF kérések esetén
  useEffect(() => {
    if (isOpen && request?.type === "TIME_OFF" && request?.user?.id) {
      const fetchBalance = async () => {
        try {
          setBalanceLoading(true);
          const response = await axios.get(`/api/time-off/balance?userId=${request.user.id}`);
          setVacationBalance(response.data);
        } catch (error) {
          console.error("Error fetching vacation balance:", error);
          setVacationBalance(null);
        } finally {
          setBalanceLoading(false);
        }
      };
      fetchBalance();
    } else {
      setVacationBalance(null);
    }
  }, [isOpen, request]);

  // Inicializáljuk az időpontokat a request típusa alapján
  useEffect(() => {
    if (isOpen && request) {
      if (request.type === "SPECIFIC_TIME" && request.preferredStartTime) {
        // SPECIFIC_TIME: kért időpontok
        const startTime = new Date(request.preferredStartTime);
        const endTime = new Date(request.preferredEndTime);
        setShiftTimes({
          startTime: startTime.toTimeString().slice(0, 5), // HH:MM
          endTime: endTime.toTimeString().slice(0, 5)
        });
      } else if (request.type === "AVAILABLE_ALL_DAY") {
        // AVAILABLE_ALL_DAY: alapértelmezett időpontok
        setShiftTimes({
          startTime: "08:00",
          endTime: "16:00"
        });
      } else {
        // TIME_OFF vagy más: nincs időpont
        setShiftTimes({
          startTime: "",
          endTime: ""
        });
      }

      // Pozíciók betöltése (SPECIFIC_TIME és AVAILABLE_ALL_DAY esetén)
      if ((request.type === "SPECIFIC_TIME" || request.type === "AVAILABLE_ALL_DAY") && request.user?.userPositions) {
        const userPositions = request.user.userPositions.map((up: any) => up.position);
        setPositions(userPositions);

        // Automatikusan kiválasztjuk a primary pozíciót
        const primaryPosition = request.user.userPositions.find((up: any) => up.isPrimary);
        if (primaryPosition) {
          setPositionId(primaryPosition.positionId);
        }
      } else {
        setPositions([]);
        setPositionId("");
      }

      // Reset notes and reject mode
      setNotes("");
      setIsRejectMode(false);
      setRejectionReason("");
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Várakozó";
      case "APPROVED":
        return "Jóváhagyott";
      case "REJECTED":
        return "Elutasított";
      case "CONVERTED_TO_SHIFT":
        return "Műszakká alakítva";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CONVERTED_TO_SHIFT":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleApproveClick = async () => {
    setIsLoading(true);

    try {
      // SPECIFIC_TIME és AVAILABLE_ALL_DAY esetén: APPROVE + CONVERT
      if (request.type === "SPECIFIC_TIME" || request.type === "AVAILABLE_ALL_DAY") {
        // Időpont validáció
        if (!shiftTimes.startTime || !shiftTimes.endTime) {
          toast.error("Add meg a műszak időpontját!");
          setIsLoading(false);
          return;
        }

        const start = new Date(`1970-01-01T${shiftTimes.startTime}:00`);
        const end = new Date(`1970-01-01T${shiftTimes.endTime}:00`);
        if (start >= end) {
          toast.error("A befejező időnek később kell lennie, mint a kezdő idő!");
          setIsLoading(false);
          return;
        }

        // Pozíció validáció
        if (!positionId) {
          toast.error("Válassz pozíciót!");
          setIsLoading(false);
          return;
        }

        // 1. APPROVE API hívás
        await axios.patch(`/api/shift-requests/${request.id}/review`, {
          action: "approve",
        });

        // 2. CONVERT API hívás (Shift létrehozása)
        const requestDate = new Date(request.date);
        const [startHours, startMinutes] = shiftTimes.startTime.split(":");
        const [endHours, endMinutes] = shiftTimes.endTime.split(":");

        const startDateTime = new Date(requestDate);
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);

        const endDateTime = new Date(requestDate);
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

        await axios.post(`/api/shift-requests/${request.id}/convert`, {
          positionId: positionId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: notes || null,
        });

        toast.success("Műszak sikeresen létrehozva!");
        onSuccess();
        onClose();
      } else if (request.type === "TIME_OFF") {
        // TIME_OFF: csak APPROVE (nincs convert)
        await axios.patch(`/api/shift-requests/${request.id}/review`, {
          action: "approve",
        });
        toast.success("Szabadság jóváhagyva!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Error approving/converting request:", error);
      if (error.response?.status === 409) {
        toast.error(error.response.data);
      } else {
        toast.error("Hiba történt a jóváhagyás során");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Kérlek add meg az elutasítás okát");
      return;
    }

    setIsLoading(true);
    try {
      await axios.patch(`/api/shift-requests/${request.id}/review`, {
        action: "reject",
        rejectionReason: rejectionReason,
      });

      toast.success("Kérés elutasítva");
      onClose();
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      if (error.response?.status === 400) {
        toast.error(error.response.data);
      } else {
        toast.error("Hiba történt az elutasítás során");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {!isRejectMode ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-nexus-primary rounded-lg">
              <HiDocumentText className="h-6 w-6 text-nexus-tertiary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Műszak kérés áttekintése</h2>
              <p className="text-sm text-gray-600">{formatDate(request.date)}</p>
            </div>
          </div>

          {/* Employee Info & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alkalmazott
              </label>
              <p className="text-base font-semibold text-gray-900">
                {request.user?.name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Státusz
              </label>
              <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Típus
              </label>
              <p className="text-base font-semibold text-gray-900">
                {getTypeLabel(request.type)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beküldve
              </label>
              <p className="text-sm text-gray-600">
                {new Date(request.createdAt).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Time Information - SPECIFIC_TIME */}
          {request.type === "SPECIFIC_TIME" && request.preferredStartTime && (
            <div className="space-y-3">
              {/* Kért időpont (read-only) */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-800 mb-1">
                  Kért időszak
                </p>
                <p className="text-base font-semibold text-blue-900">
                  {new Date(request.preferredStartTime).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}{" "}
                  -{" "}
                  {new Date(request.preferredEndTime).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Módosítható időpont */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Műszak időszak (módosítható)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kezdés *</label>
                    <input
                      type="time"
                      value={shiftTimes.startTime}
                      onChange={(e) => setShiftTimes({ ...shiftTimes, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Befejezés *</label>
                    <input
                      type="time"
                      value={shiftTimes.endTime}
                      onChange={(e) => setShiftTimes({ ...shiftTimes, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pozíció választás */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pozíció *
                </label>
                <select
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                  required
                >
                  <option value="">Válassz pozíciót...</option>
                  {positions.map((position) => {
                    const isPrimary = request.user?.userPositions?.find(
                      (up: { positionId: string; isPrimary: boolean }) => up.positionId === position.id && up.isPrimary
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

              {/* Megjegyzések */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Megjegyzések (opcionális)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Opcionális megjegyzések..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Time Information - AVAILABLE_ALL_DAY */}
          {request.type === "AVAILABLE_ALL_DAY" && (
            <div className="space-y-3">
              {/* Info banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Az alkalmazott egész nap elérhető. Add meg a pontos időpontot.
                </p>
              </div>

              {/* Időpont megadás */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Műszak időszak
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kezdés *</label>
                    <input
                      type="time"
                      value={shiftTimes.startTime}
                      onChange={(e) => setShiftTimes({ ...shiftTimes, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Befejezés *</label>
                    <input
                      type="time"
                      value={shiftTimes.endTime}
                      onChange={(e) => setShiftTimes({ ...shiftTimes, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pozíció választás */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pozíció *
                </label>
                <select
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent"
                  required
                >
                  <option value="">Válassz pozíciót...</option>
                  {positions.map((position) => {
                    const isPrimary = request.user?.userPositions?.find(
                      (up: { positionId: string; isPrimary: boolean }) => up.positionId === position.id && up.isPrimary
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

              {/* Megjegyzések */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Megjegyzések (opcionális)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Opcionális megjegyzések..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Time Off - Szabadság egyenleg */}
          {request.type === "TIME_OFF" && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">
                  🗓️ Szabadság kérés
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Ha jóváhagyod, {request.vacationDays || 1} nap kerül levonásra a szabadság egyenlegből.
                </p>
              </div>

              {/* Szabadság egyenleg megjelenítése */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <HiCalendar className="h-5 w-5 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">
                    Szabadság egyenleg
                  </h4>
                </div>

                {balanceLoading ? (
                  <p className="text-sm text-gray-500">Betöltés...</p>
                ) : vacationBalance ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {/* Éves keret */}
                      <div className="bg-white rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <HiCalendar className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-600">Éves keret</p>
                            <p className="text-sm font-bold text-gray-900">
                              {vacationBalance.annualVacationDays} nap
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Felhasznált */}
                      <div className="bg-white rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <HiCheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-600">Felhasznált</p>
                            <p className="text-sm font-bold text-gray-900">
                              {vacationBalance.usedVacationDays} nap
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Függőben */}
                      <div className="bg-white rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <HiClock className="h-4 w-4 text-yellow-600" />
                          <div>
                            <p className="text-xs text-gray-600">Függőben</p>
                            <p className="text-sm font-bold text-gray-900">
                              {vacationBalance.pendingDays} nap
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Fennmaradó */}
                      <div className="bg-white rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <HiCalendar className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-600">Fennmaradó</p>
                            <p className="text-sm font-bold text-gray-900">
                              {vacationBalance.remainingDays} nap
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rendelkezésre álló - kiemelt */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <p className="text-xs opacity-90">Rendelkezésre áll</p>
                          <p className="text-2xl font-bold">
                            {vacationBalance.availableDays} nap
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{vacationBalance.usagePercentage}%</p>
                          <p className="text-xs opacity-90">használva</p>
                        </div>
                      </div>
                    </div>

                    {/* Figyelmeztetés vagy siker üzenet */}
                    {vacationBalance.availableDays < (request.vacationDays || 1) ? (
                      <div className="flex items-start gap-2 bg-red-100 border border-red-300 rounded-lg p-2">
                        <HiExclamationTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">
                            Nincs elegendő szabadság!
                          </p>
                          <p className="text-xs text-red-700">
                            Ez a kérés {request.vacationDays || 1} napot igényel, de csak {vacationBalance.availableDays} nap áll rendelkezésre.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 bg-green-100 border border-green-300 rounded-lg p-2">
                        <HiCheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-green-800">
                            Elegendő szabadság áll rendelkezésre
                          </p>
                          <p className="text-xs text-green-700">
                            Jóváhagyás után: {vacationBalance.availableDays - (request.vacationDays || 1)} nap marad
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <HiExclamationTriangle className="h-5 w-5" />
                    <p className="text-sm">Nem sikerült betölteni az egyenleget</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes from Employee */}
          {request.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Megjegyzés az alkalmazottól
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900 italic">
                  &quot;{request.notes}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {request.status === "PENDING" ? (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsRejectMode(true)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiXMark className="inline h-5 w-5 mr-1" />
                Elutasítás
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Mégse
                </button>
                <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary hover:bg-nexus-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiCheck className="inline h-5 w-5 mr-1" />
                  {isLoading ? "Feldolgozás..." : (request.type === "TIME_OFF" ? "Jóváhagyás" : "Jóváhagyás & Műszak létrehozása")}
                </button>
              </div>
            </div>
          ) : (
            // Read-only mode - csak Bezárás gomb
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-nexus-tertiary hover:bg-nexus-primary rounded-md"
              >
                Bezárás
              </button>
            </div>
          )}
        </div>
      ) : (
        // Rejection Mode
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-red-100 rounded-lg">
              <HiXMark className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Kérés elutasítása</h2>
              <p className="text-sm text-gray-600">{request.user?.name}</p>
            </div>
          </div>

          {/* Rejection Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Elutasítás oka *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Pl: Ezen a napon már elegendő dolgozó van beosztva..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nexus-tertiary focus:border-transparent resize-none"
              disabled={isLoading}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div></div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRejectMode(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Vissza
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Elutasítás..." : "Elutasítás"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
